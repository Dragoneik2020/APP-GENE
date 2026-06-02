const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'fitgenius_secret_key_2024';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    req.userId = jwt.verify(token, JWT_SECRET).userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name, age, weight, height, fitness_level, goals } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const result = db.prepare(
      'INSERT INTO users (email, password, name, age, weight, height, fitness_level, goals) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(email, hash, name, age, weight, height, fitness_level || 'beginner', goals || '');
    
    const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId: result.lastInsertRowid, name });
  } catch (err) {
    res.status(400).json({ error: err.message.includes('UNIQUE') ? 'Email ya registrado' : err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId: user.id, name: user.name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', auth, (req, res) => {
  const users = db.prepare('SELECT id, email, name, fitness_level FROM users').all();
  res.json(users);
});

app.get('/api/user/profile', auth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, age, weight, height, fitness_level, goals FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

app.put('/api/user/profile', auth, (req, res) => {
  const { name, age, weight, height, fitness_level, goals } = req.body;
  db.prepare('UPDATE users SET name=?, age=?, weight=?, height=?, fitness_level=?, goals=? WHERE id=?')
    .run(name, age, weight, height, fitness_level, goals, req.userId);
  res.json({ success: true });
});

app.post('/api/user/push-token', auth, (req, res) => {
  const { pushToken } = req.body;
  db.prepare('UPDATE users SET push_token = ? WHERE id = ?').run(pushToken, req.userId);
  res.json({ success: true });
});

app.post('/api/ai/generate-plan', auth, async (req, res) => {
  try {
    const { goals, days_per_week, session_duration, equipment, limitations } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    const prompt = `Eres un experto entrenador fitness. Crea un plan de entrenamiento personalizado con estos datos:
- Nombre: ${user.name}
- Edad: ${user.age} años
- Peso: ${user.weight} kg
- Altura: ${user.height} cm
- Nivel: ${user.fitness_level}
- Objetivos: ${goals}
- Días por semana: ${days_per_week}
- Duración por sesión: ${session_duration} minutos
- Equipamiento disponible: ${equipment}
- Limitaciones: ${limitations}

Responde SOLO con un JSON válido con esta estructura:
{
  "plan_name": "nombre del plan",
  "description": "descripción breve",
  "weeks": [
    {
      "week_number": 1,
      "days": [
        {
          "day_name": "Lunes",
          "day_type": "strength/cardio/flexibility/rest",
          "exercises": [
            {
              "name": "nombre del ejercicio",
              "sets": 4,
              "reps": "10-12",
              "rest_seconds": 60,
              "muscle_group": "grupo muscular",
              "notes": ""
            }
          ]
        }
      ]
    }
  ]
}`;

    let planData;
    if (GROQ_API_KEY && GROQ_API_KEY !== 'gsk_tu_api_key_de_groq') {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4000
          })
        });

        if (!response.ok) {
          throw new Error(`Groq API responded with ${response.status}`);
        }

        const data = await response.json();
        const planText = data.choices[0].message.content;
        const match = planText.match(/\{[\s\S]*\}/);
        if (!match) throw new Error('No JSON found in AI response');
        planData = JSON.parse(match[0]);
      } catch (aiError) {
        console.error('AI Generation failed, using fallback:', aiError.message);
        planData = generateFallbackPlan(user, goals, days_per_week, session_duration, equipment);
      }
    } else {
      planData = generateFallbackPlan(user, goals, days_per_week, session_duration, equipment);
    }

    const result = db.prepare('INSERT INTO workout_plans (user_id, name, description, plan_data, is_ai_generated) VALUES (?, ?, ?, ?, ?)')
      .run(req.userId, planData.plan_name || 'Plan FitGenius', planData.description || '', JSON.stringify(planData), (GROQ_API_KEY && GROQ_API_KEY !== 'gsk_tu_api_key_de_groq' ? 1 : 0));

    res.json({ id: result.lastInsertRowid, ...planData });
  } catch (err) {
    console.error('Global error in generate-plan:', err);
    res.status(500).json({ error: 'Error interno al generar el plan: ' + err.message });
  }
});

function generateFallbackPlan(user, goals, daysPerWeek, duration, equipment) {
  const muscleGroups = ['Pecho', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core'];
  const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  const plan = {
    plan_name: `Plan ${goals || 'Fitness'} - ${daysPerWeek} días`,
    description: `Plan personalizado para ${user.name} con ${daysPerWeek} sesiones semanales de ${duration} minutos`,
    weeks: []
  };

  for (let week = 1; week <= 4; week++) {
    const weekPlan = { week_number: week, days: [] };
    
    for (let d = 0; d < Math.min(daysPerWeek, 7); d++) {
      const exercises = [];
      const primaryMuscle = muscleGroups[d % muscleGroups.length];
      
      exercises.push({
        name: getExerciseForMuscle(primaryMuscle),
        sets: user.fitness_level === 'beginner' ? 3 : 4,
        reps: user.fitness_level === 'beginner' ? '10-12' : '8-12',
        rest_seconds: 60,
        muscle_group: primaryMuscle,
        notes: ''
      });
      
      exercises.push({
        name: getExerciseForMuscle(primaryMuscle, true),
        sets: user.fitness_level === 'beginner' ? 3 : 4,
        reps: user.fitness_level === 'beginner' ? '12-15' : '10-12',
        rest_seconds: 60,
        muscle_group: primaryMuscle,
        notes: ''
      });

      weekPlan.days.push({
        day_name: days[d],
        day_type: d % 3 === 2 ? 'cardio' : 'strength',
        exercises
      });
    }
    
    plan.weeks.push(weekPlan);
  }
  
  return plan;
}

function getExerciseForMuscle(muscle, secondary = false) {
  const exercises = {
    'Pecho': ['Press de Banca', 'Press Inclinado', 'Fondos', 'Aperturas'],
    'Espalda': ['Dominadas', 'Remo con Barra', 'Remo con Mancuerna', 'Jalón al Pecho'],
    'Piernas': ['Sentadilla', 'Peso Muerto', 'Lunges', 'Prensa de Piernas'],
    'Hombros': ['Press Militar', 'Elevaciones Laterales', 'Face Pull', 'Press Arnold'],
    'Brazos': ['Curl de Bíceps', 'Extensión de Tríceps', 'Martillo', 'Fondos de Tríceps'],
    'Core': ['Plancha', 'Russian Twist', 'Crunch Abdominal', 'Mountain Climbers']
  };
  const list = exercises[muscle] || exercises['Pecho'];
  return list[secondary ? 1 : 0];
}

app.post('/api/workouts/custom', auth, (req, res) => {
  try {
    const { name, exercises, duration_minutes, difficulty } = req.body;
    const result = db.prepare('INSERT INTO custom_workouts (user_id, name, exercises, duration_minutes, difficulty) VALUES (?, ?, ?, ?, ?)')
      .run(req.userId, name, JSON.stringify(exercises), duration_minutes || 30, difficulty || 'medium');
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/workouts/custom', auth, (req, res) => {
  const workouts = db.prepare('SELECT * FROM custom_workouts WHERE user_id = ?').all(req.userId);
  workouts.forEach(w => w.exercises = JSON.parse(w.exercises));
  res.json(workouts);
});

app.delete('/api/workouts/custom/:id', auth, (req, res) => {
  db.prepare('DELETE FROM custom_workouts WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

app.get('/api/plans', auth, (req, res) => {
  const plans = db.prepare('SELECT * FROM workout_plans WHERE user_id = ? ORDER BY created_at DESC').all(req.userId);
  plans.forEach(p => p.plan_data = JSON.parse(p.plan_data));
  res.json(plans);
});

app.get('/api/plans/:id', auth, (req, res) => {
  const plan = db.prepare('SELECT * FROM workout_plans WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (plan) {
    plan.plan_data = JSON.parse(plan.plan_data);
    res.json(plan);
  } else {
    res.status(404).json({ error: 'Plan no encontrado' });
  }
});

app.delete('/api/plans/:id', auth, (req, res) => {
  db.prepare('DELETE FROM workout_plans WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

app.post('/api/challenges/schedule', auth, (req, res) => {
  try {
    const { workout_plan_id, custom_workout_id, challenge_date, scheduled_time } = req.body;
    const result = db.prepare(
      'INSERT INTO daily_challenges (user_id, workout_plan_id, custom_workout_id, challenge_date, scheduled_time) VALUES (?, ?, ?, ?, ?)'
    ).run(req.userId, workout_plan_id || null, custom_workout_id || null, challenge_date, scheduled_time);
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/challenges/today', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const challenges = db.prepare(`
    SELECT dc.*, wp.name as plan_name, cw.name as custom_name
    FROM daily_challenges dc
    LEFT JOIN workout_plans wp ON dc.workout_plan_id = wp.id
    LEFT JOIN custom_workouts cw ON dc.custom_workout_id = cw.id
    WHERE dc.user_id = ? AND dc.challenge_date = ?
  `).all(req.userId, today);
  res.json(challenges);
});

app.get('/api/challenges/upcoming', auth, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const challenges = db.prepare(`
    SELECT dc.*, wp.name as plan_name, cw.name as custom_name
    FROM daily_challenges dc
    LEFT JOIN workout_plans wp ON dc.workout_plan_id = wp.id
    LEFT JOIN custom_workouts cw ON dc.custom_workout_id = cw.id
    WHERE dc.user_id = ? AND dc.challenge_date >= ?
    ORDER BY dc.challenge_date, dc.scheduled_time
  `).all(req.userId, today);
  res.json(challenges);
});

app.put('/api/challenges/:id/complete', auth, (req, res) => {
  db.prepare('UPDATE daily_challenges SET completed = 1, completed_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
    .run(req.params.id, req.userId);
  res.json({ success: true });
});

app.get('/api/exercises', (req, res) => {
  const exercises = db.prepare('SELECT * FROM exercise_library').all();
  res.json(exercises);
});

app.get('/api/stats', auth, (req, res) => {
  const totalWorkouts = db.prepare('SELECT COUNT(*) as count FROM daily_challenges WHERE user_id = ? AND completed = 1').get(req.userId).count;
  const totalPlans = db.prepare('SELECT COUNT(*) as count FROM workout_plans WHERE user_id = ?').get(req.userId).count;
  const streak = db.prepare(`
    SELECT COUNT(DISTINCT challenge_date) as count 
    FROM daily_challenges 
    WHERE user_id = ? AND completed = 1 AND challenge_date >= date('now', '-7 days')
  `).get(req.userId).count;
  res.json({ totalWorkouts, totalPlans, weeklyStreak: streak });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`FitGenius API running on port ${PORT}`);
});
