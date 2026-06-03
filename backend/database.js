const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'fitgenius.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    age INTEGER,
    weight REAL,
    height REAL,
    fitness_level TEXT DEFAULT 'beginner',
    goals TEXT,
    push_token TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS workout_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    plan_data TEXT NOT NULL,
    is_ai_generated INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS custom_workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    exercises TEXT NOT NULL,
    duration_minutes INTEGER,
    difficulty TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS daily_challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    workout_plan_id INTEGER,
    custom_workout_id INTEGER,
    challenge_date DATE NOT NULL,
    scheduled_time TEXT NOT NULL,
    completed INTEGER DEFAULT 0,
    completed_at DATETIME,
    push_sent INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (workout_plan_id) REFERENCES workout_plans(id),
    FOREIGN KEY (custom_workout_id) REFERENCES custom_workouts(id)
  );

  CREATE TABLE IF NOT EXISTS workout_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    challenge_id INTEGER,
    exercise_name TEXT NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight REAL,
    notes TEXT,
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (challenge_id) REFERENCES daily_challenges(id)
  );

  CREATE TABLE IF NOT EXISTS user_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    weight REAL,
    body_fat REAL,
    muscle_mass REAL,
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS exercise_library (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment TEXT,
    difficulty TEXT DEFAULT 'medium',
    description TEXT,
    video_url TEXT,
    image_url TEXT
  );
`);

const insertExercise = db.prepare(`
  INSERT OR IGNORE INTO exercise_library (name, muscle_group, equipment, difficulty, description, image_url)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const exercises = [
  ['Press de Banca', 'Pecho', 'Barra', 'medium', 'Acostado en banca, bajar la barra al pecho y empujar hacia arriba', 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Press+de+Banca'],
  ['Sentadilla', 'Piernas', 'Barra', 'medium', 'Bajar flexionando rodillas hasta paralelo y subir', 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Sentadilla'],
  ['Peso Muerto', 'Espalda', 'Barra', 'hard', 'Levantar barra desde el suelo manteniendo la espalda recta', 'https://placehold.co/400x300/E17055/FFFFFF?text=Peso+Muerto'],
  ['Press Militar', 'Hombros', 'Barra', 'medium', 'Desde la posición erguida, elevar la barra sobre la cabeza', 'https://placehold.co/400x300/00B894/FFFFFF?text=Press+Militar'],
  ['Curl de Bíceps', 'Bíceps', 'Mancuernas', 'easy', 'Con mancuernas a los lados, flexionar codos', 'https://placehold.co/400x300/FDCB6E/333333?text=Curl+Bíceps'],
  ['Fondos', 'Pecho', 'Peso corporal', 'medium', 'Bajar el cuerpo entre paralelas y subir', 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Fondos'],
  ['Dominadas', 'Espalda', 'Barra', 'hard', 'Colgarse de barra y subir el mentón sobre ella', 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Dominadas'],
  ['Remo con Barra', 'Espalda', 'Barra', 'medium', 'Inclinado hacia adelante, llevar barra al abdomen', 'https://placehold.co/400x300/E17055/FFFFFF?text=Remo+Barra'],
  ['Extensión de Tríceps', 'Tríceps', 'Polea', 'easy', 'Empujar la polea hacia abajo extendiendo los codos', 'https://placehold.co/400x300/00B894/FFFFFF?text=Ext+Tríceps'],
  ['Lunges', 'Piernas', 'Mancuernas', 'medium', 'Dar pasos alternos flexionando ambas rodillas a 90°', 'https://placehold.co/400x300/FDCB6E/333333?text=Lunges'],
  ['Plancha', 'Core', 'Peso corporal', 'easy', 'Mantener posición de plancha el mayor tiempo posible', 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Plancha'],
  ['Russian Twist', 'Core', 'Peso corporal', 'medium', 'Sentado, girar el torso de lado a lado', 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Russian+Twist'],
  ['Burpees', 'Full body', 'Peso corporal', 'hard', 'Combina sentadilla, plancha y salto', 'https://placehold.co/400x300/E17055/FFFFFF?text=Burpees'],
  ['Mountain Climbers', 'Cardio', 'Peso corporal', 'medium', 'En posición de plancha, alternar rodillas hacia el pecho', 'https://placehold.co/400x300/00B894/FFFFFF?text=Mountain+Climbers'],
  ['Press Inclinado', 'Pecho', 'Barra', 'medium', 'Press de banca en banco inclinado a 30°', 'https://placehold.co/400x300/FDCB6E/333333?text=Press+Inclinado'],
];

const insertMany = db.transaction((exercises) => {
  for (const ex of exercises) {
    insertExercise.run(...ex);
  }
});

insertMany(exercises);

module.exports = db;
