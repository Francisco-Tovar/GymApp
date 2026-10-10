import { db } from './db';
import { WeightUnit } from '../types';

export interface RealWorkoutSession {
  workoutName: string;
  date: string;
  sets: Array<{
    exerciseName: string;
    set_number: number;
    weight: number;
    reps: number;
    unit?: WeightUnit;
  }>;
}

export const REAL_WORKOUT_HISTORY: RealWorkoutSession[] = [
  // Session 1: Friday, Sep 25, 2026 at 05:03 PM
  {
    workoutName: 'Full Body Friday',
    date: '2026-09-25T17:03:00.000Z',
    sets: [
      { exerciseName: 'EZ-Bar Romanian Deadlifts', set_number: 1, weight: 70.1, reps: 8, unit: 'lb' },
      { exerciseName: 'EZ-Bar Romanian Deadlifts', set_number: 2, weight: 70.1, reps: 7, unit: 'lb' },
      { exerciseName: 'Incline Bench Press', set_number: 1, weight: 20.1, reps: 21, unit: 'lb' },
      { exerciseName: 'Incline Bench Press', set_number: 2, weight: 20.1, reps: 10, unit: 'lb' },
      { exerciseName: 'Seated Cable Rows', set_number: 1, weight: 88, reps: 15, unit: 'lb' },
      { exerciseName: 'Seated Cable Rows', set_number: 2, weight: 88, reps: 8, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 1, weight: 300, reps: 9, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 2, weight: 300, reps: 6, unit: 'lb' },
      { exerciseName: 'Triceps Rope Pushdowns', set_number: 1, weight: 70.1, reps: 9, unit: 'lb' },
      { exerciseName: 'Triceps Rope Pushdowns', set_number: 2, weight: 70.1, reps: 5, unit: 'lb' },
      { exerciseName: 'Standing Calf Raises', set_number: 1, weight: 70.1, reps: 15, unit: 'lb' },
      { exerciseName: 'Standing Calf Raises', set_number: 2, weight: 70.1, reps: 11, unit: 'lb' },
    ],
  },

  // Session 2: Tuesday, Sep 29, 2026 at 05:09 PM
  {
    workoutName: 'Full Body Tuesday',
    date: '2026-09-29T17:09:00.000Z',
    sets: [
      { exerciseName: 'Flat Dumbbell Bench Press', set_number: 1, weight: 25, reps: 12, unit: 'lb' },
      { exerciseName: 'Flat Dumbbell Bench Press', set_number: 2, weight: 25, reps: 8, unit: 'lb' },
      { exerciseName: 'Lat Pulldowns', set_number: 1, weight: 77, reps: 5, unit: 'lb' },
      { exerciseName: 'Lat Pulldowns', set_number: 2, weight: 77, reps: 4, unit: 'lb' },
      { exerciseName: 'Seated Leg Curls', set_number: 1, weight: 90, reps: 8, unit: 'lb' },
      { exerciseName: 'Seated Leg Curls', set_number: 2, weight: 90, reps: 6, unit: 'lb' },
      { exerciseName: 'DB Lateral Raises', set_number: 1, weight: 20, reps: 14, unit: 'lb' },
      { exerciseName: 'DB Lateral Raises', set_number: 2, weight: 20, reps: 9, unit: 'lb' },
      { exerciseName: 'DB Bicep Curls', set_number: 1, weight: 20, reps: 8, unit: 'lb' },
      { exerciseName: 'DB Bicep Curls', set_number: 2, weight: 20, reps: 5, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 1, weight: 300, reps: 15, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 2, weight: 300, reps: 15, unit: 'lb' },
    ],
  },

  // Session 3: Friday, Oct 2, 2026 at 05:10 PM
  {
    workoutName: 'Full Body Friday',
    date: '2026-10-02T17:10:00.000Z',
    sets: [
      { exerciseName: 'Incline Bench Press', set_number: 1, weight: 25, reps: 10, unit: 'lb' },
      { exerciseName: 'Incline Bench Press', set_number: 2, weight: 25, reps: 9, unit: 'lb' },
      { exerciseName: 'Triceps Rope Pushdowns', set_number: 1, weight: 70, reps: 7, unit: 'lb' },
      { exerciseName: 'Triceps Rope Pushdowns', set_number: 2, weight: 70, reps: 3, unit: 'lb' },
      { exerciseName: 'Seated Cable Rows', set_number: 1, weight: 88, reps: 10, unit: 'lb' },
      { exerciseName: 'Seated Cable Rows', set_number: 2, weight: 88, reps: 8, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 1, weight: 300, reps: 15, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 2, weight: 320, reps: 11, unit: 'lb' },
      { exerciseName: 'EZ-Bar Romanian Deadlifts', set_number: 1, weight: 94, reps: 11, unit: 'lb' },
      { exerciseName: 'EZ-Bar Romanian Deadlifts', set_number: 2, weight: 94, reps: 7, unit: 'lb' },
      { exerciseName: 'Standing Calf Raises', set_number: 1, weight: 70.1, reps: 14, unit: 'lb' },
      { exerciseName: 'Standing Calf Raises', set_number: 2, weight: 70.1, reps: 8, unit: 'lb' },
    ],
  },

  // Session 4: Tuesday, Oct 6, 2026 at 05:18 PM
  {
    workoutName: 'Full Body Tuesday',
    date: '2026-10-06T17:18:00.000Z',
    sets: [
      { exerciseName: 'Flat Dumbbell Bench Press', set_number: 1, weight: 25, reps: 13, unit: 'lb' },
      { exerciseName: 'Flat Dumbbell Bench Press', set_number: 2, weight: 25, reps: 7, unit: 'lb' },
      { exerciseName: 'DB Lateral Raises', set_number: 1, weight: 20.1, reps: 11, unit: 'lb' },
      { exerciseName: 'DB Lateral Raises', set_number: 2, weight: 20.1, reps: 8, unit: 'lb' },
      { exerciseName: 'Lat Pulldowns', set_number: 1, weight: 77, reps: 12, unit: 'lb' },
      { exerciseName: 'Lat Pulldowns', set_number: 2, weight: 77, reps: 9, unit: 'lb' },
      { exerciseName: 'DB Bicep Curls', set_number: 1, weight: 30, reps: 8, unit: 'lb' },
      { exerciseName: 'DB Bicep Curls', set_number: 2, weight: 30, reps: 6, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 1, weight: 320, reps: 14, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 2, weight: 320, reps: 12, unit: 'lb' },
      { exerciseName: 'Seated Leg Curls', set_number: 1, weight: 90, reps: 8, unit: 'lb' },
      { exerciseName: 'Seated Leg Curls', set_number: 2, weight: 90, reps: 6, unit: 'lb' },
    ],
  },

  // Session 5: Friday, Oct 9, 2026 at 05:17 PM
  {
    workoutName: 'Full Body Friday',
    date: '2026-10-09T17:17:00.000Z',
    sets: [
      { exerciseName: 'Incline Bench Press', set_number: 1, weight: 24.9, reps: 8, unit: 'lb' },
      { exerciseName: 'Incline Bench Press', set_number: 2, weight: 24.9, reps: 8, unit: 'lb' },
      { exerciseName: 'Triceps Rope Pushdowns', set_number: 1, weight: 70.1, reps: 9, unit: 'lb' },
      { exerciseName: 'Triceps Rope Pushdowns', set_number: 2, weight: 70.1, reps: 7, unit: 'lb' },
      { exerciseName: 'Seated Cable Rows', set_number: 1, weight: 88, reps: 11, unit: 'lb' },
      { exerciseName: 'Seated Cable Rows', set_number: 2, weight: 88, reps: 12, unit: 'lb' },
      { exerciseName: 'EZ-Bar Romanian Deadlifts', set_number: 1, weight: 93.9, reps: 9, unit: 'lb' },
      { exerciseName: 'EZ-Bar Romanian Deadlifts', set_number: 2, weight: 93.9, reps: 9, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 1, weight: 350, reps: 13, unit: 'lb' },
      { exerciseName: 'Leg Press', set_number: 2, weight: 350, reps: 7, unit: 'lb' },
      { exerciseName: 'Standing Calf Raises', set_number: 1, weight: 70.1, reps: 15, unit: 'lb' },
      { exerciseName: 'Standing Calf Raises', set_number: 2, weight: 70.1, reps: 13, unit: 'lb' },
    ],
  },
];

const REAL_DATA_FLAG_KEY = 'gymapp_real_workout_history_v3';

/**
 * Seeds the real user workout history into Dexie DB.
 */
export async function seedRealWorkouts(): Promise<number> {
  if (typeof window !== 'undefined' && localStorage.getItem(REAL_DATA_FLAG_KEY) === 'true') {
    // Check if sessions already exist in db
    const count = await db.sessions.count();
    if (count >= REAL_WORKOUT_HISTORY.length) {
      return 0;
    }
  }

  // Build exercise name -> ID map
  const exercises = await db.exercises.toArray();
  const exerciseIdMap = new Map<string, number>();
  for (const ex of exercises) {
    if (ex.id) {
      exerciseIdMap.set(ex.name.toLowerCase().trim(), ex.id);
    }
  }

  // Helper to find or resolve exercise ID
  const resolveExerciseId = async (name: string): Promise<number> => {
    const key = name.toLowerCase().trim();
    if (exerciseIdMap.has(key)) {
      return exerciseIdMap.get(key)!;
    }
    const match = await db.exercises.where('name').equalsIgnoreCase(name).first();
    if (match && match.id) {
      exerciseIdMap.set(key, match.id);
      return match.id;
    }
    // Fallback: create exercise
    const newId = await db.exercises.add({
      name,
      muscle_groups: 'Full Body',
    });
    exerciseIdMap.set(key, Number(newId));
    return Number(newId);
  };

  // Helper to find or match workout routine
  const resolveWorkoutId = async (routineName: string): Promise<number> => {
    const directMatch = await db.workouts.where('name').equalsIgnoreCase(routineName).first();
    if (directMatch && directMatch.id) {
      return directMatch.id;
    }

    // Check alias mappings:
    // 'Full Body Tuesday' (aliases: tuesday, martes, full body a, body a)
    // 'Full Body Friday' (aliases: friday, viernes, full body b, body b)
    if (
      routineName.toLowerCase().includes('tuesday') ||
      routineName.toLowerCase().includes('martes') ||
      routineName.toLowerCase().includes('full body a') ||
      routineName.toLowerCase().includes('body a')
    ) {
      const wA =
        (await db.workouts.where('name').equalsIgnoreCase('Full Body Tuesday').first()) ||
        (await db.workouts.where('name').equalsIgnoreCase('Full Body A (2 Sets to 0 RIR)').first()) ||
        (await db.workouts.where('name').equalsIgnoreCase('Full Body Martes').first());
      if (wA && wA.id) return wA.id;
    }

    if (
      routineName.toLowerCase().includes('friday') ||
      routineName.toLowerCase().includes('viernes') ||
      routineName.toLowerCase().includes('full body b') ||
      routineName.toLowerCase().includes('body b')
    ) {
      const wB =
        (await db.workouts.where('name').equalsIgnoreCase('Full Body Friday').first()) ||
        (await db.workouts.where('name').equalsIgnoreCase('Full Body B (2 Sets to 0 RIR)').first()) ||
        (await db.workouts.where('name').equalsIgnoreCase('Full Body Viernes').first());
      if (wB && wB.id) return wB.id;
    }

    // Or create routine with this name
    const newWId = await db.workouts.add({ name: routineName });
    return Number(newWId);
  };

  let insertedCount = 0;

  for (const sessionData of REAL_WORKOUT_HISTORY) {
    const datePrefix = sessionData.date.substring(0, 10);
    const existing = await db.sessions.filter((s) => s.date.startsWith(datePrefix)).first();

    let sessionId: number;
    if (existing && existing.id) {
      sessionId = existing.id;
      // Clear existing sets for this session to update cleanly
      await db.session_sets.where('session_id').equals(sessionId).delete();
      await db.sessions.update(sessionId, {
        workout_id: await resolveWorkoutId(sessionData.workoutName),
        date: sessionData.date,
      });
    } else {
      const workoutId = await resolveWorkoutId(sessionData.workoutName);
      sessionId = Number(
        await db.sessions.add({
          workout_id: workoutId,
          date: sessionData.date,
        })
      );
      insertedCount++;
    }

    for (const s of sessionData.sets) {
      const exId = await resolveExerciseId(s.exerciseName);
      await db.session_sets.add({
        session_id: sessionId,
        exercise_id: exId,
        set_number: s.set_number,
        weight: s.weight,
        reps: s.reps,
        unit: s.unit || 'lb',
        exercise_type: 'weight_reps',
      });
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(REAL_DATA_FLAG_KEY, 'true');
  }

  return insertedCount;
}
