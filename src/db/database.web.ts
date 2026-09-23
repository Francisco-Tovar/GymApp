import alasql from 'alasql';

export interface WebDatabase {
  execAsync(sql: string): Promise<void>;
  getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null>;
  getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]>;
  runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number }>;
}

const DB_STORAGE_KEY = 'gymapp_sqlite_web_data_v2';
const TABLE_NAMES = ['exercises', 'workouts', 'workout_exercises', 'sessions', 'session_sets'];

export const saveToStorage = () => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const dump: Record<string, any[]> = {};
      for (const table of TABLE_NAMES) {
        try {
          const rows = alasql(`SELECT * FROM ${table}`);
          dump[table] = Array.isArray(rows) ? rows : [];
        } catch (e) {
          dump[table] = [];
        }
      }
      window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(dump));
    }
  } catch (err) {
    console.error('Failed to persist web database:', err);
  }
};

export const loadFromStorage = (): boolean => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(DB_STORAGE_KEY);
      if (raw) {
        const dump = JSON.parse(raw);
        let hasData = false;

        if (Array.isArray(dump.exercises) && dump.exercises.length > 0) {
          alasql('DELETE FROM exercises;');
          for (const row of dump.exercises) {
            alasql('INSERT INTO exercises (id, name, muscle_groups) VALUES (?, ?, ?);', [row.id, row.name, row.muscle_groups]);
          }
          hasData = true;
        }

        if (Array.isArray(dump.workouts) && dump.workouts.length > 0) {
          alasql('DELETE FROM workouts;');
          for (const row of dump.workouts) {
            alasql('INSERT INTO workouts (id, name) VALUES (?, ?);', [row.id, row.name]);
          }
          hasData = true;
        }

        if (Array.isArray(dump.workout_exercises) && dump.workout_exercises.length > 0) {
          alasql('DELETE FROM workout_exercises;');
          for (const row of dump.workout_exercises) {
            alasql('INSERT INTO workout_exercises (id, workout_id, exercise_id) VALUES (?, ?, ?);', [row.id || 0, row.workout_id, row.exercise_id]);
          }
          hasData = true;
        }

        if (Array.isArray(dump.sessions) && dump.sessions.length > 0) {
          alasql('DELETE FROM sessions;');
          for (const row of dump.sessions) {
            alasql('INSERT INTO sessions (id, workout_id, date) VALUES (?, ?, ?);', [row.id, row.workout_id, row.date]);
          }
          hasData = true;
        }

        if (Array.isArray(dump.session_sets) && dump.session_sets.length > 0) {
          alasql('DELETE FROM session_sets;');
          for (const row of dump.session_sets) {
            alasql('INSERT INTO session_sets (id, session_id, exercise_id, set_number, weight, reps, unit) VALUES (?, ?, ?, ?, ?, ?, ?);', [
              row.id,
              row.session_id,
              row.exercise_id,
              row.set_number,
              row.weight,
              row.reps,
              row.unit,
            ]);
          }
          hasData = true;
        }

        return hasData;
      }
    }
  } catch (err) {
    console.error('Failed to load web database from storage:', err);
  }
  return false;
};

let dbInstance: WebDatabase | null = null;

export const getDB = async (): Promise<WebDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = {
    async execAsync(sql: string): Promise<void> {
      const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.toLowerCase().startsWith('pragma'));

      for (const stmt of statements) {
        try {
          let normalizedStmt = stmt
            .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
            .replace(/INTEGER PRIMARY KEY/gi, 'INT AUTO_INCREMENT PRIMARY KEY')
            .replace(/REAL/gi, 'FLOAT')
            .replace(/TEXT/gi, 'STRING');

          if (normalizedStmt.toUpperCase().includes('FOREIGN KEY')) {
            const lines = normalizedStmt.split('\n');
            const filteredLines = lines.filter((l) => !l.toUpperCase().includes('FOREIGN KEY'));
            normalizedStmt = filteredLines.join('\n');
            normalizedStmt = normalizedStmt.replace(/,\s*\)/g, '\n)');
          }

          alasql(normalizedStmt);
        } catch (err) {
          console.warn('Alasql exec statement error:', err, stmt);
        }
      }
      saveToStorage();
    },

    async getFirstAsync<T = any>(sql: string, params?: any[]): Promise<T | null> {
      try {
        const cleanSql = sql.trim();
        const res = alasql(cleanSql, params || []);
        if (Array.isArray(res) && res.length > 0) {
          return res[0] as T;
        }
        return null;
      } catch (err) {
        console.error('Alasql getFirstAsync error:', err, sql);
        return null;
      }
    },

    async getAllAsync<T = any>(sql: string, params?: any[]): Promise<T[]> {
      try {
        const cleanSql = sql.trim();
        const res = alasql(cleanSql, params || []);
        if (Array.isArray(res)) {
          return res as T[];
        }
        return [];
      } catch (err) {
        console.error('Alasql getAllAsync error:', err, sql);
        return [];
      }
    },

    async runAsync(sql: string, params?: any[]): Promise<{ lastInsertRowId: number }> {
      try {
        const cleanSql = sql.trim();
        alasql(cleanSql, params || []);

        const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
        let lastInsertRowId = 1;
        if (match && match[1]) {
          const tableName = match[1];
          const maxRes = alasql(`SELECT MAX(id) as maxId FROM ${tableName}`);
          if (Array.isArray(maxRes) && maxRes.length > 0 && maxRes[0]?.maxId !== undefined) {
            lastInsertRowId = Number(maxRes[0].maxId);
          }
        }
        saveToStorage();
        return { lastInsertRowId };
      } catch (err) {
        console.error('Alasql runAsync error:', err, sql);
        return { lastInsertRowId: 0 };
      }
    },
  };

  return dbInstance;
};

export const initDatabase = async (): Promise<void> => {
  const db = await getDB();

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS exercises (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name STRING NOT NULL,
      muscle_groups STRING NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workouts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name STRING NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_exercises (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workout_id INT NOT NULL,
      exercise_id INT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      workout_id INT NOT NULL,
      date STRING NOT NULL
    );

    CREATE TABLE IF NOT EXISTS session_sets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      session_id INT NOT NULL,
      exercise_id INT NOT NULL,
      set_number INT NOT NULL,
      weight FLOAT NOT NULL,
      reps INT NOT NULL,
      unit STRING NOT NULL
    );
  `);

  const hasLoaded = loadFromStorage();

  const existingExercises = await db.getAllAsync<{ id: number }>('SELECT id FROM exercises;');
  const existingWorkouts = await db.getAllAsync<{ id: number }>('SELECT id FROM workouts;');

  if (!hasLoaded || existingExercises.length === 0 || existingWorkouts.length === 0) {
    await seedInitialData(db);
    saveToStorage();
  }
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

const seedInitialData = async (db: WebDatabase): Promise<void> => {
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
  const sessionCheck = await db.getAllAsync<{ id: number }>('SELECT id FROM sessions;');
  if (!sessionCheck || sessionCheck.length === 0) {
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
