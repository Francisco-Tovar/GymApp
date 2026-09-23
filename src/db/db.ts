import Dexie, { type EntityTable } from 'dexie';
import { Exercise, Workout, WorkoutExercise, Session, SessionSet, WeightUnit } from '../types';
import { convertWeight } from '../utils/unitConversion';
import { seedDummyWorkouts } from './seedDummyData';
import { RoutineSessionRecord, RoutineExerciseInput } from '../utils/routineProgression';

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

let initPromise: Promise<void> | null = null;

export const initDatabase = async (): Promise<void> => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    await db.transaction('rw', db.exercises, db.workouts, db.workout_exercises, db.sessions, db.session_sets, async () => {
      // 1. Deduplicate existing exercises by name
      const allExercises = await db.exercises.toArray();
      const seenExercises = new Map<string, number>();
      for (const ex of allExercises) {
        if (!ex.id) continue;
        const key = ex.name.trim().toLowerCase();
        if (seenExercises.has(key)) {
          const canonicalId = seenExercises.get(key)!;
          // Re-map any workout_exercises and session_sets referencing the duplicate ID to canonicalId
          const weDups = await db.workout_exercises.where('exercise_id').equals(ex.id).toArray();
          for (const row of weDups) {
            await db.workout_exercises.where('id').equals(row.id!).delete();
          }
          const ssDups = await db.session_sets.where('exercise_id').equals(ex.id).toArray();
          for (const row of ssDups) {
            await db.session_sets.update(row.id!, { exercise_id: canonicalId });
          }
          await db.exercises.delete(ex.id);
        } else {
          seenExercises.set(key, ex.id);
        }
      }

      // 2. Deduplicate existing workouts by name
      const allWorkouts = await db.workouts.toArray();
      const seenWorkouts = new Map<string, number>();
      for (const w of allWorkouts) {
        if (!w.id) continue;
        const key = w.name.trim().toLowerCase();
        if (seenWorkouts.has(key)) {
          const canonicalId = seenWorkouts.get(key)!;
          // Delete workout_exercises for the duplicate
          await db.workout_exercises.where('workout_id').equals(w.id).delete();
          // Re-map sessions to canonicalId
          const sessDups = await db.sessions.where('workout_id').equals(w.id).toArray();
          for (const s of sessDups) {
            await db.sessions.update(s.id!, { workout_id: canonicalId });
          }
          await db.workouts.delete(w.id);
        } else {
          seenWorkouts.set(key, w.id);
        }
      }

      // 3. Deduplicate workout_exercises (same workout_id & exercise_id)
      const allWE = await db.workout_exercises.toArray();
      const seenWE = new Set<string>();
      for (const we of allWE) {
        if (!we.id) continue;
        const key = `${we.workout_id}-${we.exercise_id}`;
        if (seenWE.has(key)) {
          await db.workout_exercises.delete(we.id);
        } else {
          seenWE.add(key);
        }
      }

      // 4. Deduplicate sessions (same workout_id & date)
      const allSessions = await db.sessions.toArray();
      const seenSessions = new Set<string>();
      for (const s of allSessions) {
        if (!s.id) continue;
        const key = `${s.workout_id}-${s.date}`;
        if (seenSessions.has(key)) {
          await db.session_sets.where('session_id').equals(s.id).delete();
          await db.sessions.delete(s.id);
        } else {
          seenSessions.add(key);
        }
      }

      // 5. Seed initial data ONLY IF database is empty
      const exerciseCount = await db.exercises.count();
      if (exerciseCount === 0) {
        const exerciseIdMap: Record<string, number> = {};

        for (const ex of INITIAL_EXERCISES) {
          const existing = await db.exercises.where('name').equalsIgnoreCase(ex.name).first();
          if (existing && existing.id) {
            exerciseIdMap[ex.name] = existing.id;
          } else {
            const id = await db.exercises.add({ name: ex.name, muscle_groups: ex.muscle_groups });
            exerciseIdMap[ex.name] = Number(id);
          }
        }

        for (const w of INITIAL_WORKOUTS) {
          const existingW = await db.workouts.where('name').equalsIgnoreCase(w.name).first();
          let workoutId = existingW?.id;
          if (!workoutId) {
            const id = await db.workouts.add({ name: w.name });
            workoutId = Number(id);
          }
          for (const exName of w.exerciseNames) {
            const exId = exerciseIdMap[exName];
            if (exId && workoutId) {
              const existingWE = await db.workout_exercises
                .where('workout_id')
                .equals(workoutId)
                .and((item) => item.exercise_id === exId)
                .first();
              if (!existingWE) {
                await db.workout_exercises.add({
                  workout_id: workoutId,
                  exercise_id: exId,
                });
              }
            }
          }
        }

        // Seed sample session if history is empty
        const sessionCount = await db.sessions.count();
        if (sessionCount === 0) {
          const workout = await db.workouts.where('name').equalsIgnoreCase(INITIAL_TODAY_SESSION.workoutName).first();
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
    });

    // Restore standard Workout A and Workout B routines
    await restoreOriginalWorkouts();

    // Seed dummy progressive overload workouts
    await seedDummyWorkouts();
  })();

  return initPromise;
};

export const restoreOriginalWorkouts = async (): Promise<void> => {
  await db.transaction('rw', db.exercises, db.workouts, db.workout_exercises, db.sessions, async () => {
    // 1. Alias mapping to merge and canonicalize any loose exercise names
    const aliasMapping: Record<string, string[]> = {
      'Flat Dumbbell Bench Press': ['flat bench db press', 'flat dumbbell bench press', 'dumbbell bench press'],
      'DB Lateral Raises': ['lateral raises (db)', 'db lateral raises', 'lateral raises', 'dumbbell lateral raises'],
      'DB Bicep Curls': ['bicep curls (db)', 'db bicep curls', 'bicep curls', 'dumbbell bicep curls'],
      'Hack Squats': ['hack squats', 'hack squat'],
      'Lat Pulldowns': ['lat pulldowns', 'lat pulldown'],
      'Seated Leg Curls': ['seated leg curls', 'seated leg curl', 'leg curls'],
      'EZ-Bar Romanian Deadlifts': ['ez-bar romanian deadlifts', 'romanian deadlifts', 'rdl', 'ez bar romanian deadlifts'],
      'Incline Bench Press': ['incline bench press', 'incline barbell bench press', 'incline db bench press'],
      'Seated Cable Rows': ['seated cable rows', 'seated cable row', 'cable rows'],
      'Leg Press': ['leg press'],
      'Triceps Rope Pushdowns': ['triceps rope pushdowns', 'tricep rope pushdowns', 'triceps pushdowns'],
      'Standing Calf Raises': ['standing calf raises', 'standing calf raise', 'calf raises'],
    };

    const exerciseIdMap: Record<string, number> = {};
    for (const ex of INITIAL_EXERCISES) {
      let existing = await db.exercises.where('name').equalsIgnoreCase(ex.name).first();

      if (!existing) {
        const aliases = aliasMapping[ex.name] || [];
        for (const alias of aliases) {
          const aliasedMatch = await db.exercises.where('name').equalsIgnoreCase(alias).first();
          if (aliasedMatch) {
            existing = aliasedMatch;
            if (aliasedMatch.id) {
              await db.exercises.update(aliasedMatch.id, { name: ex.name, muscle_groups: ex.muscle_groups });
            }
            break;
          }
        }
      }

      if (!existing) {
        const newId = await db.exercises.add({ name: ex.name, muscle_groups: ex.muscle_groups });
        exerciseIdMap[ex.name] = Number(newId);
      } else if (existing.id) {
        exerciseIdMap[ex.name] = existing.id;
      }
    }

    // 2. Identify Workout A and Workout B
    const allWorkouts = await db.workouts.toArray();

    let workoutA = allWorkouts.find(
      (w) => w.name.trim().toLowerCase() === INITIAL_WORKOUTS[0].name.toLowerCase()
    );
    if (!workoutA) {
      workoutA = allWorkouts.find(
        (w) => w.name.toLowerCase().includes('body a') || w.name.toLowerCase().includes('workout a')
      );
    }

    let workoutB = allWorkouts.find(
      (w) => w.name.trim().toLowerCase() === INITIAL_WORKOUTS[1].name.toLowerCase()
    );
    if (!workoutB) {
      workoutB = allWorkouts.find(
        (w) => w.name.toLowerCase().includes('body b') || w.name.toLowerCase().includes('workout b')
      );
    }

    let workoutAId: number;
    if (workoutA && workoutA.id) {
      workoutAId = workoutA.id;
      await db.workouts.update(workoutAId, { name: INITIAL_WORKOUTS[0].name });
    } else {
      const idA = await db.workouts.add({ name: INITIAL_WORKOUTS[0].name });
      workoutAId = Number(idA);
    }

    let workoutBId: number;
    if (workoutB && workoutB.id) {
      workoutBId = workoutB.id;
      await db.workouts.update(workoutBId, { name: INITIAL_WORKOUTS[1].name });
    } else {
      const idB = await db.workouts.add({ name: INITIAL_WORKOUTS[1].name });
      workoutBId = Number(idB);
    }

    const canonicalIds = new Set<number>([workoutAId, workoutBId]);

    // 3. Delete ANY workout that is not Workout A or Workout B so they are the ONLY ones
    for (const w of allWorkouts) {
      if (w.id && !canonicalIds.has(w.id)) {
        const extraSessions = await db.sessions.where('workout_id').equals(w.id).toArray();
        for (const s of extraSessions) {
          if (s.id) {
            await db.sessions.update(s.id, { workout_id: workoutAId });
          }
        }
        await db.workout_exercises.where('workout_id').equals(w.id).delete();
        await db.workouts.delete(w.id);
      }
    }

    // 4. Strictly reset Workout A exercises to the exact canonical structure
    await db.workout_exercises.where('workout_id').equals(workoutAId).delete();
    for (const exName of INITIAL_WORKOUTS[0].exerciseNames) {
      const exId = exerciseIdMap[exName];
      if (exId) {
        await db.workout_exercises.add({
          workout_id: workoutAId,
          exercise_id: exId,
        });
      }
    }

    // 5. Strictly reset Workout B exercises to the exact canonical structure
    await db.workout_exercises.where('workout_id').equals(workoutBId).delete();
    for (const exName of INITIAL_WORKOUTS[1].exerciseNames) {
      const exId = exerciseIdMap[exName];
      if (exId) {
        await db.workout_exercises.add({
          workout_id: workoutBId,
          exercise_id: exId,
        });
      }
    }
  });

  if (typeof window !== 'undefined') {
    localStorage.removeItem('gymapp_workout_order_pwa');
  }
};


export { seedDummyWorkouts };

// CRUD API
export const fetchExercises = async (): Promise<Exercise[]> => {
  const all = await db.exercises.orderBy('name').toArray();
  const seen = new Set<string>();
  const unique: Exercise[] = [];
  for (const ex of all) {
    const key = ex.name.trim().toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(ex);
    }
  }
  return unique;
};

export const insertExercise = async (name: string, muscleGroups: string): Promise<number> => {
  const existing = await db.exercises.where('name').equalsIgnoreCase(name.trim()).first();
  if (existing && existing.id) return existing.id;
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
  const seen = new Set<string>();

  for (const w of workouts) {
    if (!w.id) continue;
    const key = w.name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

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

  result.sort((a, b) => {
    const isA = a.name.toLowerCase().includes('body a') || a.name.toLowerCase().includes('workout a');
    const isB = b.name.toLowerCase().includes('body b') || b.name.toLowerCase().includes('workout b');
    if (isA && !isB) return -1;
    if (isB && !isA) return 1;
    return (a.id ?? 0) - (b.id ?? 0);
  });

  return result;
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
  const numericId = Number(id);
  await db.transaction('rw', db.workouts, db.workout_exercises, async () => {
    await db.workouts.delete(numericId);
    await db.workout_exercises.where('workout_id').equals(numericId).delete();
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

export const fetchAllWorkoutSessionRecords = async (
  targetUnit: WeightUnit = 'lb'
): Promise<Array<{
  exerciseId: string;
  exerciseName: string;
  date: string;
  sets: Array<{ weight: number; reps: number; setNumber?: number; unit?: string }>;
}>> => {
  const allSessions = await db.sessions.toArray();
  const allSets = await db.session_sets.toArray();
  const allExercises = await db.exercises.toArray();

  const exerciseMap = new Map<number, string>();
  for (const ex of allExercises) {
    if (ex.id) exerciseMap.set(ex.id, ex.name);
  }

  const sessionMap = new Map<number, { id: number; date: string }>();
  for (const s of allSessions) {
    if (s.id) sessionMap.set(s.id, { id: s.id, date: s.date });
  }

  // Group sets by `${sessionId}-${exerciseId}`
  const grouped = new Map<string, {
    exerciseId: string;
    exerciseName: string;
    date: string;
    sets: Array<{ weight: number; reps: number; setNumber?: number; unit?: string }>;
  }>();

  for (const setItem of allSets) {
    if (!setItem.session_id) continue;
    const session = sessionMap.get(setItem.session_id);
    if (!session) continue;

    const key = `${setItem.session_id}-${setItem.exercise_id}`;
    const exName = exerciseMap.get(setItem.exercise_id) || `Exercise #${setItem.exercise_id}`;
    const convertedWeight = convertWeight(setItem.weight, setItem.unit || 'lb', targetUnit);

    let group = grouped.get(key);
    if (!group) {
      group = {
        exerciseId: String(setItem.exercise_id),
        exerciseName: exName,
        date: session.date,
        sets: [],
      };
      grouped.set(key, group);
    }

    group.sets.push({
      setNumber: setItem.set_number,
      weight: convertedWeight,
      reps: setItem.reps,
      unit: targetUnit,
    });
  }

  return Array.from(grouped.values());
};

export const fetchRoutineSessionRecords = async (
  workoutId?: number,
  targetUnit: WeightUnit = 'lb'
): Promise<RoutineSessionRecord[]> => {
  const allSessions = await db.sessions.toArray();
  const allSets = await db.session_sets.toArray();
  const allExercises = await db.exercises.toArray();
  const allWorkouts = await db.workouts.toArray();

  const exerciseMap = new Map<number, string>();
  for (const ex of allExercises) {
    if (ex.id) exerciseMap.set(ex.id, ex.name);
  }

  const workoutMap = new Map<number, string>();
  for (const w of allWorkouts) {
    if (w.id) workoutMap.set(w.id, w.name);
  }

  const relevantSessions = workoutId
    ? allSessions.filter((s) => s.workout_id === workoutId)
    : allSessions;

  const sessionSetsBySession = new Map<number, SessionSet[]>();
  for (const setItem of allSets) {
    if (!setItem.session_id) continue;
    const list = sessionSetsBySession.get(setItem.session_id) || [];
    list.push(setItem);
    sessionSetsBySession.set(setItem.session_id, list);
  }

  const results: RoutineSessionRecord[] = [];

  for (const s of relevantSessions) {
    if (!s.id) continue;
    const sets = sessionSetsBySession.get(s.id) || [];
    if (sets.length === 0) continue;

    const exercisesMap = new Map<number, Array<{ weight: number; reps: number; setNumber?: number }>>();
    for (const st of sets) {
      const list = exercisesMap.get(st.exercise_id) || [];
      const convertedWeight = convertWeight(st.weight, st.unit || 'lb', targetUnit);
      list.push({
        weight: convertedWeight,
        reps: st.reps,
        setNumber: st.set_number,
      });
      exercisesMap.set(st.exercise_id, list);
    }

    const exercises: RoutineExerciseInput[] = [];
    for (const [exId, exSets] of exercisesMap.entries()) {
      const exName = exerciseMap.get(exId) || `Exercise #${exId}`;
      exercises.push({
        exerciseId: String(exId),
        exerciseName: exName,
        sets: exSets,
      });
    }

    results.push({
      date: s.date,
      workoutId: s.workout_id,
      workoutName: workoutMap.get(s.workout_id) || `Routine #${s.workout_id}`,
      exercises,
    });
  }

  results.sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
  return results;
};

/**
 * Permanently wipes all recorded sessions, session sets, and custom workouts,
 * and restores default canonical Workout A and Workout B routines.
 */
export const clearAllDataAndReset = async (): Promise<void> => {
  await db.transaction('rw', db.exercises, db.workouts, db.workout_exercises, db.sessions, db.session_sets, async () => {
    await db.session_sets.clear();
    await db.sessions.clear();
    await db.workout_exercises.clear();
    await db.workouts.clear();
    await db.exercises.clear();
  });

  if (typeof window !== 'undefined') {
    localStorage.removeItem('gymapp_workout_order_pwa');
    localStorage.removeItem('active-workout-storage');
    localStorage.removeItem('gymapp_dummy_workouts_seeded_1year_v3');
  }

  // Re-seed initial canonical Workout A and Workout B routines
  await restoreOriginalWorkouts();
};

