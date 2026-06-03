const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// Auth middleware - PlanFit uses hardcoded user_id=1 header
const auth = (req, res, next) => {
  req.userId = parseInt(req.headers['user_id']) || 1;
  next();
};
app.use(auth);

// --- User Settings ---
app.get('/api/v1/main', (req, res) => {
  const user = db.prepare('SELECT round, minute, condition FROM users WHERE id = ?').get(req.userId);
  res.json({ status: 200, message: 'Success', data: user });
});

app.put('/api/v1/main', (req, res) => {
  const { minute, condition } = req.body;
  if (minute !== undefined && (minute < 1 || minute > 59)) {
    return res.json({ status: 400, message: 'Minute must be 1-59' });
  }
  const validConditions = ['Best', 'Good', 'Heavy', 'Tired', 'Bad'];
  if (condition && !validConditions.includes(condition)) {
    return res.json({ status: 400, message: 'Invalid condition' });
  }
  const updates = [];
  const params = [];
  if (minute !== undefined) { updates.push('minute = ?'); params.push(minute); }
  if (condition !== undefined) { updates.push('condition = ?'); params.push(condition); }
  if (updates.length > 0) {
    params.push(req.userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  // Increment round on settings update
  db.prepare('UPDATE users SET round = round + 1 WHERE id = ?').run(req.userId);
  const user = db.prepare('SELECT round, minute, condition FROM users WHERE id = ?').get(req.userId);
  res.json({ status: 200, message: 'Settings updated', data: user });
});

// --- Exercises List ---
app.get('/api/v1/exercises', (req, res) => {
  const exercises = db.prepare(`
    SELECT e.id, e.name, e.weight, e.times as count, e.muscle_group, e.image_url,
           r.id as routine_id, r.seq as index, r.is_like
    FROM routine r
    JOIN exercises e ON r.exercise_id = e.id
    WHERE r.user_id = ?
    ORDER BY r.seq ASC
  `).all(req.userId);
  res.json({ status: 200, message: 'Success', data: { exercises } });
});

app.put('/api/v1/exercises', (req, res) => {
  const { exercises } = req.body;
  if (!exercises || !Array.isArray(exercises)) {
    return res.json({ status: 400, message: 'exercises array required' });
  }
  const update = db.prepare('UPDATE routine SET seq = ? WHERE id = ? AND user_id = ?');
  const txn = db.transaction((items) => {
    for (const item of items) {
      update.run(item.index, item.id, req.userId);
    }
  });
  txn(exercises);
  res.json({ status: 200, message: 'Reordered' });
});

// --- Routine ---
app.post('/api/v1/routine', (req, res) => {
  const exerciseId = parseInt(req.query.exerciseId) || parseInt(req.body.exerciseId);
  if (!exerciseId) return res.json({ status: 400, message: 'exerciseId required' });

  const existing = db.prepare('SELECT id, seq FROM routine WHERE user_id = ? AND exercise_id = ?').get(req.userId, exerciseId);
  if (existing) return res.json({ status: 200, message: 'Already in routine' });

  const maxSeq = db.prepare('SELECT MAX(seq) as max FROM routine WHERE user_id = ?').get(req.userId).max || 0;
  const result = db.prepare('INSERT INTO routine (user_id, exercise_id, seq) VALUES (?, ?, ?)').run(req.userId, exerciseId, maxSeq + 1);
  
  // Create default 4 sets
  const insertSet = db.prepare('INSERT INTO sets (routine_id, is_done) VALUES (?, 0)');
  for (let i = 0; i < 4; i++) insertSet.run(result.lastInsertRowid);

  res.json({ status: 200, message: 'Exercise added to routine' });
});

// --- Like / Unlike ---
app.patch('/api/v1/exercises/:exerciseId/like', (req, res) => {
  const exerciseId = parseInt(req.params.exerciseId);
  db.prepare('UPDATE routine SET is_like = 1 WHERE user_id = ? AND exercise_id = ?').run(req.userId, exerciseId);
  res.json({ status: 200, message: 'Liked' });
});

app.patch('/api/v1/exercises/:exerciseId/unlike', (req, res) => {
  const exerciseId = parseInt(req.params.exerciseId);
  db.prepare('UPDATE routine SET is_like = 0 WHERE user_id = ? AND exercise_id = ?').run(req.userId, exerciseId);
  res.json({ status: 200, message: 'Unliked' });
});

// --- Sets ---
app.post('/api/v1/exercises/:exerciseId/set', (req, res) => {
  const exerciseId = parseInt(req.params.exerciseId);
  const routineItem = db.prepare('SELECT id FROM routine WHERE user_id = ? AND exercise_id = ?').get(req.userId, exerciseId);
  if (!routineItem) return res.json({ status: 404, message: 'Exercise not in routine' });
  
  db.prepare('INSERT INTO sets (routine_id, is_done) VALUES (?, 0)').run(routineItem.id);
  res.json({ status: 200, message: 'Set added' });
});

app.put('/api/v1/exercises/:exerciseId/set', (req, res) => {
  const exerciseId = parseInt(req.params.exerciseId);
  const routineItem = db.prepare('SELECT id FROM routine WHERE user_id = ? AND exercise_id = ?').get(req.userId, exerciseId);
  if (!routineItem) return res.json({ status: 404, message: 'Exercise not in routine' });

  const incompleteSet = db.prepare('SELECT id FROM sets WHERE routine_id = ? AND is_done = 0 ORDER BY id ASC LIMIT 1').get(routineItem.id);
  if (!incompleteSet) return res.json({ status: 200, message: 'All sets completed' });

  db.prepare('UPDATE sets SET is_done = 1 WHERE id = ?').run(incompleteSet.id);
  res.json({ status: 200, message: 'Set completed' });
});

// --- Get sets for an exercise ---
app.get('/api/v1/exercises/:exerciseId/sets', (req, res) => {
  const exerciseId = parseInt(req.params.exerciseId);
  const routineItem = db.prepare('SELECT id FROM routine WHERE user_id = ? AND exercise_id = ?').get(req.userId, exerciseId);
  if (!routineItem) return res.json({ status: 404, message: 'Not in routine', data: { sets: [] } });

  const sets = db.prepare('SELECT id, is_done FROM sets WHERE routine_id = ? ORDER BY id ASC').all(routineItem.id);
  res.json({ status: 200, message: 'Success', data: { sets } });
});

// --- Available exercises (not yet in routine) ---
app.get('/api/v1/exercises/available', (req, res) => {
  const inRoutine = db.prepare('SELECT exercise_id FROM routine WHERE user_id = ?').all(req.userId).map(r => r.exercise_id);
  let exercises;
  if (inRoutine.length > 0) {
    exercises = db.prepare(`SELECT * FROM exercises WHERE id NOT IN (${inRoutine.join(',')})`).all();
  } else {
    exercises = db.prepare('SELECT * FROM exercises').all();
  }
  res.json({ status: 200, message: 'Success', data: { exercises } });
});

// --- Warm-up exercises ---
app.get('/api/v1/warmup', (req, res) => {
  const warmups = [
    { name: 'Neck Rolls', duration: '30s', image: 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Neck+Rolls' },
    { name: 'Arm Circles', duration: '30s', image: 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Arm+Circles' },
    { name: 'Torso Twist', duration: '30s', image: 'https://placehold.co/400x300/E17055/FFFFFF?text=Torso+Twist' },
    { name: 'Hip Circles', duration: '30s', image: 'https://placehold.co/400x300/00B894/FFFFFF?text=Hip+Circles' },
    { name: 'Leg Swings', duration: '30s', image: 'https://placehold.co/400x300/FDCB6E/333333?text=Leg+Swings' },
    { name: 'Ankle Rolls', duration: '30s', image: 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Ankle+Rolls' },
    { name: 'Cat-Cow Stretch', duration: '45s', image: 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Cat+Cow' },
    { name: 'Downward Dog', duration: '45s', image: 'https://placehold.co/400x300/E17055/FFFFFF?text=Downward+Dog' },
  ];
  res.json({ status: 200, message: 'Success', data: { warmups } });
});

// --- Profile/Health ---
app.get('/profile', (req, res) => {
  res.json({ activeProfile: 'planfit-prod' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`PlanFit API running on port ${PORT}`);
});
