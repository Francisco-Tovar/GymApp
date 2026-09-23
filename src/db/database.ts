import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('gymapp.db');
  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDB();

  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      muscle_groups TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      PRIMARY KEY (workout_id, exercise_id),
      FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workouts (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS session_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL NOT NULL,
      reps INTEGER NOT NULL,
      unit TEXT NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE,
      FOREIGN KEY (exercise_id) REFERENCES exercises (id) ON DELETE CASCADE
    );
  `);

  await seedInitialData(db);
};

const INITIAL_EXERCISES = [
  { name: 'Hack Squats', muscle_groups: 'Quadriceps, Glutes' },
  { name: 'Flat Dumbbell Bench Press', muscle_groups: 'Chest, Shoulders, Triceps' },
  { name: 'Lat Pulldowns', muscle_groups: 'Lats, Upper Back, Biceps' },
  { name: 'Seated Leg Curls', muscle_groups: 'Hamstrings' },
  { name: 'DB Lateral Raises', muscle_groups: 'Side Deltoids, Shoulders' },
  { name: 'DB Bicep Curls', muscle_groups: 'Biceps, Forearms' },
  { name: 'EZ-Bar Romanian Deadlifts', muscle_groups: 'Hamstrings, Glutes, Lower Back' },
  { name: 'Incline Bench Press', muscle_groups: 'Upper Chest, Shoulders, Triceps' },
  { name: 'Seated Cable Rows', muscle_groups: 'Upper Back, Lats, Biceps' },
  { name: 'Leg Press', muscle_groups: 'Quadriceps, Glutes' },
  { name: 'Triceps Rope Pushdowns', muscle_groups: 'Triceps' },
  { name: 'Standing Calf Raises', muscle_groups: 'Calves' },
];

const INITIAL_WORKOUTS = [
  {
    name: 'Full Body A (2 Sets to 0 RIR)',
    exerciseNames: [
      'Hack Squats',
      'Flat Dumbbell Bench Press',
      'Lat Pulldowns',
      'Seated Leg Curls',
      'DB Lateral Raises',
      'DB Bicep Curls',
    ],
  },
  {
    name: 'Full Body B (2 Sets to 0 RIR)',
    exerciseNames: [
      'EZ-Bar Romanian Deadlifts',
      'Incline Bench Press',
      'Seated Cable Rows',
      'Leg Press',
      'Triceps Rope Pushdowns',
      'Standing Calf Raises',
    ],
  },
];

const INITIAL_TODAY_SESSION = {
  workoutName: 'Full Body A (2 Sets to 0 RIR)',
  date: new Date().toISOString(),
  sets: [
    { exerciseName: 'Hack Squats', set_number: 1, weight: 270, reps: 18, unit: 'lb' },
    { exerciseName: 'Hack Squats', set_number: 2, weight: 180, reps: 18, unit: 'lb' },
    { exerciseName: 'Flat Dumbbell Bench Press', set_number: 1, weight: 25, reps: 13, unit: 'lb' },
    { exerciseName: 'Flat Dumbbell Bench Press', set_number: 2, weight: 20, reps: 7, unit: 'lb' },
    { exerciseName: 'Lat Pulldowns', set_number: 1, weight: 66, reps: 14, unit: 'lb' },
    { exerciseName: 'Lat Pulldowns', set_number: 2, weight: 66, reps: 11, unit: 'lb' },
    { exerciseName: 'Seated Leg Curls', set_number: 1, weight: 80, reps: 9, unit: 'lb' },
    { exerciseName: 'Seated Leg Curls', set_number: 2, weight: 80, reps: 5, unit: 'lb' },
    { exerciseName: 'DB Lateral Raises', set_number: 1, weight: 20, reps: 14, unit: 'lb' },
    { exerciseName: 'DB Lateral Raises', set_number: 2, weight: 15, reps: 15, unit: 'lb' },
    { exerciseName: 'DB Bicep Curls', set_number: 1, weight: 20, reps: 5, unit: 'lb' },
    { exerciseName: 'DB Bicep Curls', set_number: 2, weight: 15, reps: 7, unit: 'lb' },
  ],
};

const seedInitialData = async (db: SQLite.SQLiteDatabase): Promise<void> => {
  // Clear old placeholder workouts & deadlift placeholder if present
  await db.runAsync("DELETE FROM workouts WHERE name IN ('Push Day', 'Leg & Pull Focus');");
  await db.runAsync("DELETE FROM exercises WHERE name = 'Deadlift';");

  const exerciseIdMap: Record<string, number> = {};

  for (const ex of INITIAL_EXERCISES) {
    const existing = await db.getFirstAsync<{ id: number }>('SELECT id FROM exercises WHERE name = ?;', [ex.name]);
    if (!existing) {
      const res = await db.runAsync(
        'INSERT INTO exercises (name, muscle_groups) VALUES (?, ?);',
        [ex.name, ex.muscle_groups]
      );
      exerciseIdMap[ex.name] = res.lastInsertRowId;
    } else {
      exerciseIdMap[ex.name] = existing.id;
    }
  }

  for (const w of INITIAL_WORKOUTS) {
    const existingWorkout = await db.getFirstAsync<{ id: number }>('SELECT id FROM workouts WHERE name = ?;', [w.name]);
    let workoutId = existingWorkout ? existingWorkout.id : 0;

    if (!existingWorkout) {
      const res = await db.runAsync('INSERT INTO workouts (name) VALUES (?);', [w.name]);
      workoutId = res.lastInsertRowId;
    }

    if (workoutId) {
      const existingWe = await db.getAllAsync<{ id: number }>(
        'SELECT id FROM workout_exercises WHERE workout_id = ?;',
        [workoutId]
      );
      if (!existingWe || existingWe.length === 0) {
        for (const exName of w.exerciseNames) {
          const exId = exerciseIdMap[exName];
          if (exId) {
            await db.runAsync(
              'INSERT INTO workout_exercises (workout_id, exercise_id) VALUES (?, ?);',
              [workoutId, exId]
            );
          }
        }
      }
    }
  }

  // Seed today's session if history is empty
  const sessionCheck = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM sessions;');
  if (!sessionCheck || Number(sessionCheck.count) === 0) {
    const workout = await db.getFirstAsync<{ id: number }>('SELECT id FROM workouts WHERE name = ?;', [INITIAL_TODAY_SESSION.workoutName]);
    if (workout) {
      const res = await db.runAsync('INSERT INTO sessions (workout_id, date) VALUES (?, ?);', [workout.id, INITIAL_TODAY_SESSION.date]);
      const sessionId = res.lastInsertRowId;
      if (sessionId) {
        for (const setItem of INITIAL_TODAY_SESSION.sets) {
          const exId = exerciseIdMap[setItem.exerciseName];
          if (exId) {
            await db.runAsync(
              'INSERT INTO session_sets (session_id, exercise_id, set_number, weight, reps, unit) VALUES (?, ?, ?, ?, ?, ?);',
              [sessionId, exId, setItem.set_number, setItem.weight, setItem.reps, setItem.unit]
            );
          }
        }
      }
    }
  }
};
