const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'planfit.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    round INTEGER DEFAULT 1,
    minute INTEGER DEFAULT 30,
    condition TEXT DEFAULT 'Good'
  );

  CREATE TABLE IF NOT EXISTS exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    weight INTEGER DEFAULT 0,
    times INTEGER DEFAULT 10,
    muscle_group TEXT DEFAULT '',
    image_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS routine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL DEFAULT 1,
    exercise_id INTEGER NOT NULL,
    is_like INTEGER DEFAULT 0,
    seq INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
  );

  CREATE TABLE IF NOT EXISTS sets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    routine_id INTEGER NOT NULL,
    is_done INTEGER DEFAULT 0,
    FOREIGN KEY (routine_id) REFERENCES routine(id)
  );
`);

// Seed default user if not exists
const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
if (userCount === 0) {
  db.prepare('INSERT INTO users (round, minute, condition) VALUES (1, 30, \'Good\')').run();
}

// Seed exercises if empty
const exCount = db.prepare('SELECT COUNT(*) as c FROM exercises').get().c;
if (exCount === 0) {
  const seedExercises = [
    ['Bench Press', 40, 10, 'Chest', 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Bench+Press'],
    ['Squat', 60, 8, 'Legs', 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Squat'],
    ['Deadlift', 80, 6, 'Back', 'https://placehold.co/400x300/E17055/FFFFFF?text=Deadlift'],
    ['Overhead Press', 30, 10, 'Shoulders', 'https://placehold.co/400x300/00B894/FFFFFF?text=OH+Press'],
    ['Barbell Row', 50, 10, 'Back', 'https://placehold.co/400x300/FDCB6E/333333?text=Barbell+Row'],
    ['Pull Up', 0, 8, 'Back', 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Pull+Up'],
    ['Dumbbell Curl', 12, 12, 'Biceps', 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Curl'],
    ['Tricep Pushdown', 20, 12, 'Triceps', 'https://placehold.co/400x300/E17055/FFFFFF?text=Triceps'],
    ['Lateral Raise', 10, 15, 'Shoulders', 'https://placehold.co/400x300/00B894/FFFFFF?text=Lateral+Raise'],
    ['Leg Press', 100, 10, 'Legs', 'https://placehold.co/400x300/FDCB6E/333333?text=Leg+Press'],
    ['Lat Pulldown', 50, 10, 'Back', 'https://placehold.co/400x300/FF6B35/FFFFFF?text=Lat+Pulldown'],
    ['Cable Fly', 15, 12, 'Chest', 'https://placehold.co/400x300/6C5CE7/FFFFFF?text=Cable+Fly'],
    ['Romanian Deadlift', 50, 10, 'Hamstrings', 'https://placehold.co/400x300/E17055/FFFFFF?text=RDL'],
    ['Plank', 0, 60, 'Core', 'https://placehold.co/400x300/00B894/FFFFFF?text=Plank'],
    ['Face Pull', 15, 15, 'Rear Delts', 'https://placehold.co/400x300/FDCB6E/333333?text=Face+Pull'],
  ];
  const insert = db.prepare('INSERT INTO exercises (name, weight, times, muscle_group, image_url) VALUES (?, ?, ?, ?, ?)');
  for (const ex of seedExercises) {
    insert.run(...ex);
  }
}

module.exports = db;
