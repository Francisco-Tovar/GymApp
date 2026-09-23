import { getDB } from './database';
import { Exercise, Workout, Session, SessionSet, WeightUnit } from '../types';
import { convertWeight } from '../utils/unitConversion';

export const fetchExercises = async (): Promise<Exercise[]> => {
  const db = await getDB();
  return await db.getAllAsync<Exercise>('SELECT * FROM exercises ORDER BY name ASC;');
};

export const insertExercise = async (name: string, muscleGroups: string): Promise<number> => {
  const db = await getDB();
  const res = await db.runAsync(
    'INSERT INTO exercises (name, muscle_groups) VALUES (?, ?);',
    [name.trim(), muscleGroups.trim()]
  );
  return res.lastInsertRowId;
};

export const deleteExercise = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM exercises WHERE id = ?;', [id]);
};

export const updateExercise = async (id: number, name: string, muscleGroups: string): Promise<void> => {
  const db = await getDB();
  await db.runAsync(
    'UPDATE exercises SET name = ?, muscle_groups = ? WHERE id = ?;',
    [name.trim(), muscleGroups.trim(), id]
  );
};

export const fetchWorkouts = async (): Promise<Workout[]> => {
  const db = await getDB();
  const workouts = await db.getAllAsync<{ id: number; name: string }>('SELECT * FROM workouts ORDER BY id DESC;');

  const result: Workout[] = [];
  for (const w of workouts) {
    const weRows = await db.getAllAsync<{ exercise_id: number }>(
      'SELECT exercise_id FROM workout_exercises WHERE workout_id = ? ORDER BY id ASC;',
      [w.id]
    );
    const exercises: Exercise[] = [];
    for (const row of weRows) {
      const ex = await db.getFirstAsync<Exercise>('SELECT * FROM exercises WHERE id = ?;', [row.exercise_id]);
      if (ex) exercises.push(ex);
    }
    result.push({
      ...w,
      exercises,
      exercise_ids: exercises.map((e) => e.id),
    });
  }

  return result;
};

export const fetchWorkoutById = async (workoutId: number): Promise<Workout | null> => {
  const db = await getDB();
  const workout = await db.getFirstAsync<{ id: number; name: string }>(
    'SELECT * FROM workouts WHERE id = ?;',
    [workoutId]
  );
  if (!workout) return null;

  const weRows = await db.getAllAsync<{ exercise_id: number }>(
    'SELECT exercise_id FROM workout_exercises WHERE workout_id = ? ORDER BY id ASC;',
    [workoutId]
  );

  const exercises: Exercise[] = [];
  for (const row of weRows) {
    const ex = await db.getFirstAsync<Exercise>('SELECT * FROM exercises WHERE id = ?;', [row.exercise_id]);
    if (ex) exercises.push(ex);
  }

  return {
    ...workout,
    exercises,
    exercise_ids: exercises.map((e) => e.id),
  };
};

export const insertWorkout = async (name: string, exerciseIds: number[]): Promise<number> => {
  const db = await getDB();
  const res = await db.runAsync('INSERT INTO workouts (name) VALUES (?);', [name.trim()]);
  const workoutId = res.lastInsertRowId;

  for (const exerciseId of exerciseIds) {
    await db.runAsync(
      'INSERT INTO workout_exercises (workout_id, exercise_id) VALUES (?, ?);',
      [workoutId, exerciseId]
    );
  }

  return workoutId;
};

export const deleteWorkout = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM workouts WHERE id = ?;', [id]);
};

export const updateWorkout = async (id: number, name: string, exerciseIds: number[]): Promise<void> => {
  const db = await getDB();
  await db.runAsync('UPDATE workouts SET name = ? WHERE id = ?;', [name.trim(), id]);
  await db.runAsync('DELETE FROM workout_exercises WHERE workout_id = ?;', [id]);

  for (const exerciseId of exerciseIds) {
    await db.runAsync(
      'INSERT INTO workout_exercises (workout_id, exercise_id) VALUES (?, ?);',
      [id, exerciseId]
    );
  }
};

export const saveCompletedSession = async (
  workoutId: number,
  dateIso: string,
  sets: SessionSet[]
): Promise<number> => {
  const db = await getDB();
  const res = await db.runAsync(
    'INSERT INTO sessions (workout_id, date) VALUES (?, ?);',
    [workoutId, dateIso]
  );
  const sessionId = res.lastInsertRowId;

  for (const setItem of sets) {
    await db.runAsync(
      `INSERT INTO session_sets (session_id, exercise_id, set_number, weight, reps, unit)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [sessionId, setItem.exercise_id, setItem.set_number, setItem.weight, setItem.reps, setItem.unit]
    );
  }

  return sessionId;
};

export const deleteSession = async (id: number): Promise<void> => {
  const db = await getDB();
  await db.runAsync('DELETE FROM session_sets WHERE session_id = ?;', [id]);
  await db.runAsync('DELETE FROM sessions WHERE id = ?;', [id]);
};

export const fetchSessionsHistory = async (): Promise<Session[]> => {
  const db = await getDB();
  const sessions = await db.getAllAsync<{ id: number; workout_id: number; date: string }>(
    'SELECT id, workout_id, date FROM sessions ORDER BY date DESC;'
  );

  const result: Session[] = [];
  for (const s of sessions) {
    const workout = await db.getFirstAsync<{ name: string }>(
      'SELECT name FROM workouts WHERE id = ?;',
      [s.workout_id]
    );
    const sets = await db.getAllAsync<{ id: number }>(
      'SELECT id FROM session_sets WHERE session_id = ?;',
      [s.id]
    );
    result.push({
      id: s.id,
      workout_id: s.workout_id,
      workout_name: workout ? workout.name : 'Workout Session',
      date: s.date,
      total_sets: sets ? sets.length : 0,
    });
  }

  return result;
};

export const fetchSessionSetsDetail = async (sessionId: number): Promise<SessionSet[]> => {
  const db = await getDB();
  return await db.getAllAsync<SessionSet>(`
    SELECT ss.*, e.name as exercise_name
    FROM session_sets ss
    LEFT JOIN exercises e ON ss.exercise_id = e.id
    WHERE ss.session_id = ?
    ORDER BY ss.exercise_id ASC, ss.set_number ASC;
  `, [sessionId]);
};

export const fetchHeaviestWeightsMap = async (
  exerciseIds: number[],
  targetUnit: WeightUnit = 'lb'
): Promise<Record<number, number>> => {
  if (!exerciseIds || exerciseIds.length === 0) return {};
  const db = await getDB();
  const resultMap: Record<number, number> = {};

  for (const exId of exerciseIds) {
    const rows = await db.getAllAsync<{ weight: number; unit: WeightUnit }>(
      'SELECT weight, unit FROM session_sets WHERE exercise_id = ?;',
      [exId]
    );
    if (rows && rows.length > 0) {
      let maxConverted = 0;
      for (const row of rows) {
        const converted = convertWeight(row.weight, row.unit || 'lb', targetUnit);
        if (converted > maxConverted) {
          maxConverted = converted;
        }
      }
      if (maxConverted > 0) {
        resultMap[exId] = maxConverted;
      }
    }
  }

  return resultMap;
};
