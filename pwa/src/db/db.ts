import Dexie, { type EntityTable } from 'dexie';
import { Exercise, Workout, WorkoutExercise, Session, SessionSet, WeightUnit } from '../types';
import { convertWeight } from '../utils/unitConversion';

export class GymAppDatabase extends Dexie {
  exercises!: EntityTable<Exercise, 'id'>;
  workouts!: EntityTable<{ id?: number; name: string }, 'id'>;
  workout_exercises!: EntityTable<WorkoutExercise, 'id'>;
  sessions!: EntityTable<{ id?: number; workout_id: number; date: string }, 'id'>;
  session_sets!: EntityTable<SessionSet, 'id'>;

  constructor() {
    super('GymAppDB');
    this.version(1).stores({
      exercises: '++id, name, muscle_groups',
      workouts: '++id, name',
      workout_exercises: '++id, workout_id, exercise_id',
      sessions: '++id, workout_id, date',
      session_sets: '++id, session_id, exercise_id, set_number',
    });
  }
}

export const db = new GymAppDatabase();

export const INITIAL_EXERCISES = [
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

export const INITIAL_WORKOUTS = [
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

export const INITIAL_TODAY_SESSION = {
  workoutName: 'Full Body A (2 Sets to 0 RIR)',
  date: new Date().toISOString(),
  sets: [
    { exerciseName: 'Hack Squats', set_number: 1, weight: 270, reps: 18, unit: 'lb' as WeightUnit },
    { exerciseName: 'Hack Squats', set_number: 2, weight: 180, reps: 18, unit: 'lb' as WeightUnit },
    { exerciseName: 'Flat Dumbbell Bench Press', set_number: 1, weight: 25, reps: 13, unit: 'lb' as WeightUnit },
    { exerciseName: 'Flat Dumbbell Bench Press', set_number: 2, weight: 20, reps: 7, unit: 'lb' as WeightUnit },
    { exerciseName: 'Lat Pulldowns', set_number: 1, weight: 66, reps: 14, unit: 'lb' as WeightUnit },
    { exerciseName: 'Lat Pulldowns', set_number: 2, weight: 66, reps: 11, unit: 'lb' as WeightUnit },
    { exerciseName: 'Seated Leg Curls', set_number: 1, weight: 80, reps: 9, unit: 'lb' as WeightUnit },
    { exerciseName: 'Seated Leg Curls', set_number: 2, weight: 80, reps: 5, unit: 'lb' as WeightUnit },
    { exerciseName: 'DB Lateral Raises', set_number: 1, weight: 20, reps: 14, unit: 'lb' as WeightUnit },
    { exerciseName: 'DB Lateral Raises', set_number: 2, weight: 15, reps: 15, unit: 'lb' as WeightUnit },
    { exerciseName: 'DB Bicep Curls', set_number: 1, weight: 20, reps: 5, unit: 'lb' as WeightUnit },
    { exerciseName: 'DB Bicep Curls', set_number: 2, weight: 15, reps: 7, unit: 'lb' as WeightUnit },
  ],
};

export const initDatabase = async (): Promise<void> => {
  const exerciseCount = await db.exercises.count();
  if (exerciseCount === 0) {
    const exerciseIdMap: Record<string, number> = {};

    for (const ex of INITIAL_EXERCISES) {
      const id = await db.exercises.add({ name: ex.name, muscle_groups: ex.muscle_groups });
      exerciseIdMap[ex.name] = Number(id);
    }

    for (const w of INITIAL_WORKOUTS) {
      const workoutId = await db.workouts.add({ name: w.name });
      for (const exName of w.exerciseNames) {
        const exId = exerciseIdMap[exName];
        if (exId) {
          await db.workout_exercises.add({
            workout_id: Number(workoutId),
            exercise_id: exId,
          });
        }
      }
    }

    // Seed sample session if history is empty
    const sessionCount = await db.sessions.count();
    if (sessionCount === 0) {
      const workout = await db.workouts.where('name').equals(INITIAL_TODAY_SESSION.workoutName).first();
      if (workout && workout.id) {
        const sessionId = await db.sessions.add({
          workout_id: workout.id,
          date: INITIAL_TODAY_SESSION.date,
        });

        for (const setItem of INITIAL_TODAY_SESSION.sets) {
          const exId = exerciseIdMap[setItem.exerciseName];
          if (exId) {
            await db.session_sets.add({
              session_id: Number(sessionId),
              exercise_id: exId,
              set_number: setItem.set_number,
              weight: setItem.weight,
              reps: setItem.reps,
              unit: setItem.unit,
            });
          }
        }
      }
    }
  }
};

// CRUD API
export const fetchExercises = async (): Promise<Exercise[]> => {
  return await db.exercises.orderBy('name').toArray();
};

export const insertExercise = async (name: string, muscleGroups: string): Promise<number> => {
  const id = await db.exercises.add({ name: name.trim(), muscle_groups: muscleGroups.trim() });
  return Number(id);
};

export const updateExercise = async (id: number, name: string, muscleGroups: string): Promise<void> => {
  await db.exercises.update(id, { name: name.trim(), muscle_groups: muscleGroups.trim() });
};

export const deleteExercise = async (id: number): Promise<void> => {
  await db.transaction('rw', db.exercises, db.workout_exercises, db.session_sets, async () => {
    await db.exercises.delete(id);
    await db.workout_exercises.where('exercise_id').equals(id).delete();
    await db.session_sets.where('exercise_id').equals(id).delete();
  });
};

export const fetchWorkouts = async (): Promise<Workout[]> => {
  const workouts = await db.workouts.toArray();
  const result: Workout[] = [];

  for (const w of workouts) {
    if (!w.id) continue;
    const weRows = await db.workout_exercises.where('workout_id').equals(w.id).toArray();
    const exercises: Exercise[] = [];
    for (const row of weRows) {
      const ex = await db.exercises.get(row.exercise_id);
      if (ex) exercises.push(ex);
    }
    result.push({
      id: w.id,
      name: w.name,
      exercises,
      exercise_ids: exercises.map((e) => e.id as number),
    });
  }

  return result.reverse();
};

export const fetchWorkoutById = async (workoutId: number): Promise<Workout | null> => {
  const workout = await db.workouts.get(workoutId);
  if (!workout || !workout.id) return null;

  const weRows = await db.workout_exercises.where('workout_id').equals(workoutId).toArray();
  const exercises: Exercise[] = [];
  for (const row of weRows) {
    const ex = await db.exercises.get(row.exercise_id);
    if (ex) exercises.push(ex);
  }

  return {
    id: workout.id,
    name: workout.name,
    exercises,
    exercise_ids: exercises.map((e) => e.id as number),
  };
};

export const insertWorkout = async (name: string, exerciseIds: number[]): Promise<number> => {
  const workoutId = await db.transaction('rw', db.workouts, db.workout_exercises, async () => {
    const id = await db.workouts.add({ name: name.trim() });
    for (const exId of exerciseIds) {
      await db.workout_exercises.add({
        workout_id: Number(id),
        exercise_id: exId,
      });
    }
    return Number(id);
  });
  return workoutId;
};

export const updateWorkout = async (id: number, name: string, exerciseIds: number[]): Promise<void> => {
  await db.transaction('rw', db.workouts, db.workout_exercises, async () => {
    await db.workouts.update(id, { name: name.trim() });
    await db.workout_exercises.where('workout_id').equals(id).delete();
    for (const exId of exerciseIds) {
      await db.workout_exercises.add({
        workout_id: id,
        exercise_id: exId,
      });
    }
  });
};

export const deleteWorkout = async (id: number): Promise<void> => {
  await db.transaction('rw', db.workouts, db.workout_exercises, db.sessions, db.session_sets, async () => {
    await db.workouts.delete(id);
    await db.workout_exercises.where('workout_id').equals(id).delete();
    const sessions = await db.sessions.where('workout_id').equals(id).toArray();
    for (const s of sessions) {
      if (s.id) {
        await db.session_sets.where('session_id').equals(s.id).delete();
      }
    }
    await db.sessions.where('workout_id').equals(id).delete();
  });
};

export const saveCompletedSession = async (
  workoutId: number,
  dateIso: string,
  sets: SessionSet[]
): Promise<number> => {
  return await db.transaction('rw', db.sessions, db.session_sets, async () => {
    const sessionId = await db.sessions.add({
      workout_id: workoutId,
      date: dateIso,
    });

    for (const setItem of sets) {
      await db.session_sets.add({
        session_id: Number(sessionId),
        exercise_id: setItem.exercise_id,
        set_number: setItem.set_number,
        weight: setItem.weight,
        reps: setItem.reps,
        unit: setItem.unit,
      });
    }

    return Number(sessionId);
  });
};

export const deleteSession = async (id: number): Promise<void> => {
  await db.transaction('rw', db.sessions, db.session_sets, async () => {
    await db.session_sets.where('session_id').equals(id).delete();
    await db.sessions.delete(id);
  });
};

export const fetchSessionsHistory = async (): Promise<Session[]> => {
  const sessions = await db.sessions.orderBy('date').reverse().toArray();
  const result: Session[] = [];

  for (const s of sessions) {
    if (!s.id) continue;
    const workout = await db.workouts.get(s.workout_id);
    const sets = await db.session_sets.where('session_id').equals(s.id).toArray();
    result.push({
      id: s.id,
      workout_id: s.workout_id,
      workout_name: workout ? workout.name : 'Workout Session',
      date: s.date,
      total_sets: sets.length,
    });
  }

  return result;
};

export const fetchSessionSetsDetail = async (sessionId: number): Promise<SessionSet[]> => {
  const sets = await db.session_sets.where('session_id').equals(sessionId).toArray();
  const enriched: SessionSet[] = [];

  for (const setItem of sets) {
    const exercise = await db.exercises.get(setItem.exercise_id);
    enriched.push({
      ...setItem,
      exercise_name: exercise ? exercise.name : `Exercise #${setItem.exercise_id}`,
    });
  }

  enriched.sort((a, b) => {
    if (a.exercise_id !== b.exercise_id) return a.exercise_id - b.exercise_id;
    return a.set_number - b.set_number;
  });

  return enriched;
};

export const fetchHeaviestWeightsMap = async (
  exerciseIds: number[],
  targetUnit: WeightUnit = 'lb'
): Promise<Record<number, number>> => {
  if (!exerciseIds || exerciseIds.length === 0) return {};
  const resultMap: Record<number, number> = {};

  for (const exId of exerciseIds) {
    const sets = await db.session_sets.where('exercise_id').equals(exId).toArray();
    if (sets && sets.length > 0) {
      let maxConverted = 0;
      for (const setItem of sets) {
        const converted = convertWeight(setItem.weight, setItem.unit || 'lb', targetUnit);
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
