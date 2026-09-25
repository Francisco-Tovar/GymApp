import { db } from './db';
import { WeightUnit } from '../types';

export interface RawDummyItem {
  exerciseName: string;
  date: string;
  sets: Array<{ weight: number; reps: number }>;
}

export const DUMMY_WORKOUT_DATA: RawDummyItem[] = [
  // Session 1: October 15, 2025 (~11.3 months ago)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2025-10-15',
    sets: [
      { weight: 15, reps: 10 },
      { weight: 15, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2025-10-15',
    sets: [
      { weight: 10, reps: 12 },
      { weight: 8, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2025-10-15',
    sets: [
      { weight: 10, reps: 10 },
      { weight: 10, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2025-10-15',
    sets: [
      { weight: 45, reps: 12 },
      { weight: 40, reps: 12 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2025-10-15',
    sets: [
      { weight: 140, reps: 15 },
      { weight: 120, reps: 15 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2025-10-15',
    sets: [
      { weight: 50, reps: 12 },
      { weight: 50, reps: 10 },
    ],
  },

  // Session 2: November 20, 2025 (~10.1 months ago)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2025-11-20',
    sets: [
      { weight: 15, reps: 12 },
      { weight: 15, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2025-11-20',
    sets: [
      { weight: 10, reps: 15 },
      { weight: 10, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2025-11-20',
    sets: [
      { weight: 12, reps: 8 },
      { weight: 10, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2025-11-20',
    sets: [
      { weight: 50, reps: 10 },
      { weight: 45, reps: 12 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2025-11-20',
    sets: [
      { weight: 160, reps: 15 },
      { weight: 140, reps: 15 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2025-11-20',
    sets: [
      { weight: 55, reps: 10 },
      { weight: 50, reps: 12 },
    ],
  },

  // Session 3: December 18, 2025 (~9.2 months ago)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2025-12-18',
    sets: [
      { weight: 17.5, reps: 10 },
      { weight: 15, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2025-12-18',
    sets: [
      { weight: 12, reps: 10 },
      { weight: 10, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2025-12-18',
    sets: [
      { weight: 12, reps: 10 },
      { weight: 12, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2025-12-18',
    sets: [
      { weight: 50, reps: 12 },
      { weight: 50, reps: 10 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2025-12-18',
    sets: [
      { weight: 180, reps: 14 },
      { weight: 160, reps: 15 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2025-12-18',
    sets: [
      { weight: 60, reps: 10 },
      { weight: 55, reps: 10 },
    ],
  },

  // Session 4: January 22, 2026 (~8.0 months ago)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-01-22',
    sets: [
      { weight: 17.5, reps: 12 },
      { weight: 17.5, reps: 9 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-01-22',
    sets: [
      { weight: 12, reps: 12 },
      { weight: 10, reps: 14 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-01-22',
    sets: [
      { weight: 15, reps: 6 },
      { weight: 12, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-01-22',
    sets: [
      { weight: 55, reps: 10 },
      { weight: 50, reps: 12 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-01-22',
    sets: [
      { weight: 180, reps: 16 },
      { weight: 180, reps: 14 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-01-22',
    sets: [
      { weight: 65, reps: 8 },
      { weight: 60, reps: 10 },
    ],
  },

  // Session 5: February 26, 2026 (~6.9 months ago)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-02-26',
    sets: [
      { weight: 20, reps: 8 },
      { weight: 17.5, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-02-26',
    sets: [
      { weight: 12, reps: 15 },
      { weight: 12, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-02-26',
    sets: [
      { weight: 15, reps: 8 },
      { weight: 12, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-02-26',
    sets: [
      { weight: 55, reps: 12 },
      { weight: 55, reps: 10 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-02-26',
    sets: [
      { weight: 200, reps: 15 },
      { weight: 180, reps: 15 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-02-26',
    sets: [
      { weight: 65, reps: 10 },
      { weight: 60, reps: 12 },
    ],
  },

  // Session 6: April 02, 2026 (~5.7 months ago - within 6M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-04-02',
    sets: [
      { weight: 20, reps: 10 },
      { weight: 20, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-04-02',
    sets: [
      { weight: 15, reps: 10 },
      { weight: 12, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-04-02',
    sets: [
      { weight: 15, reps: 10 },
      { weight: 15, reps: 7 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-04-02',
    sets: [
      { weight: 60, reps: 10 },
      { weight: 55, reps: 12 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-04-02',
    sets: [
      { weight: 225, reps: 14 },
      { weight: 200, reps: 15 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-04-02',
    sets: [
      { weight: 70, reps: 10 },
      { weight: 65, reps: 10 },
    ],
  },

  // Session 7: May 14, 2026 (~4.3 months ago - within 6M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-05-14',
    sets: [
      { weight: 20, reps: 12 },
      { weight: 20, reps: 9 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-05-14',
    sets: [
      { weight: 15, reps: 12 },
      { weight: 15, reps: 10 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-05-14',
    sets: [
      { weight: 17.5, reps: 6 },
      { weight: 15, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-05-14',
    sets: [
      { weight: 60, reps: 12 },
      { weight: 60, reps: 10 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-05-14',
    sets: [
      { weight: 225, reps: 16 },
      { weight: 225, reps: 14 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-05-14',
    sets: [
      { weight: 70, reps: 12 },
      { weight: 70, reps: 9 },
    ],
  },

  // Session 8: June 25, 2026 (~2.9 months ago - within 3M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-06-25',
    sets: [
      { weight: 22.5, reps: 8 },
      { weight: 20, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-06-25',
    sets: [
      { weight: 15, reps: 14 },
      { weight: 15, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-06-25',
    sets: [
      { weight: 17.5, reps: 8 },
      { weight: 15, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-06-25',
    sets: [
      { weight: 66, reps: 10 },
      { weight: 60, reps: 12 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-06-25',
    sets: [
      { weight: 250, reps: 14 },
      { weight: 225, reps: 15 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-06-25',
    sets: [
      { weight: 75, reps: 10 },
      { weight: 70, reps: 10 },
    ],
  },

  // Session 9: July 30, 2026 (~1.8 months ago - within 3M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-07-30',
    sets: [
      { weight: 22.5, reps: 10 },
      { weight: 22.5, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-07-30',
    sets: [
      { weight: 17.5, reps: 10 },
      { weight: 15, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-07-30',
    sets: [
      { weight: 17.5, reps: 10 },
      { weight: 17.5, reps: 7 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-07-30',
    sets: [
      { weight: 66, reps: 12 },
      { weight: 66, reps: 9 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-07-30',
    sets: [
      { weight: 270, reps: 12 },
      { weight: 250, reps: 14 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-07-30',
    sets: [
      { weight: 75, reps: 12 },
      { weight: 75, reps: 8 },
    ],
  },

  // Session 10: August 20, 2026 (~1.1 months ago - within 3M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-08-20',
    sets: [
      { weight: 25, reps: 8 },
      { weight: 22.5, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-08-20',
    sets: [
      { weight: 17.5, reps: 12 },
      { weight: 15, reps: 14 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-08-20',
    sets: [
      { weight: 20, reps: 5 },
      { weight: 17.5, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-08-20',
    sets: [
      { weight: 66, reps: 14 },
      { weight: 66, reps: 11 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-08-20',
    sets: [
      { weight: 270, reps: 15 },
      { weight: 270, reps: 12 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-08-20',
    sets: [
      { weight: 80, reps: 8 },
      { weight: 75, reps: 8 },
    ],
  },

  // Session 11: September 05, 2026 (~18 days ago - within 1M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-09-05',
    sets: [
      { weight: 25, reps: 10 },
      { weight: 22.5, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-09-05',
    sets: [
      { weight: 20, reps: 8 },
      { weight: 17.5, reps: 10 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-09-05',
    sets: [
      { weight: 20, reps: 6 },
      { weight: 17.5, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-09-05',
    sets: [
      { weight: 72, reps: 10 },
      { weight: 66, reps: 11 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-09-05',
    sets: [
      { weight: 290, reps: 14 },
      { weight: 270, reps: 14 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-09-05',
    sets: [
      { weight: 80, reps: 10 },
      { weight: 80, reps: 6 },
    ],
  },

  // Session 12: September 15, 2026 (~8 days ago - within 1M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-09-15',
    sets: [
      { weight: 25, reps: 12 },
      { weight: 25, reps: 8 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-09-15',
    sets: [
      { weight: 20, reps: 12 },
      { weight: 17.5, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-09-15',
    sets: [
      { weight: 20, reps: 7 },
      { weight: 20, reps: 5 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-09-15',
    sets: [
      { weight: 72, reps: 12 },
      { weight: 72, reps: 9 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-09-15',
    sets: [
      { weight: 315, reps: 12 },
      { weight: 290, reps: 14 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-09-15',
    sets: [
      { weight: 85, reps: 8 },
      { weight: 80, reps: 7 },
    ],
  },

  // Session 13: September 22, 2026 (Yesterday - within 1M)
  {
    exerciseName: 'Flat Bench DB Press',
    date: '2026-09-22',
    sets: [
      { weight: 27.5, reps: 8 },
      { weight: 25, reps: 10 },
    ],
  },
  {
    exerciseName: 'Lateral Raises (DB)',
    date: '2026-09-22',
    sets: [
      { weight: 20, reps: 15 },
      { weight: 17.5, reps: 12 },
    ],
  },
  {
    exerciseName: 'Bicep Curls (DB)',
    date: '2026-09-22',
    sets: [
      { weight: 22.5, reps: 6 },
      { weight: 20, reps: 7 },
    ],
  },
  {
    exerciseName: 'Lat Pulldowns',
    date: '2026-09-22',
    sets: [
      { weight: 77, reps: 10 },
      { weight: 72, reps: 10 },
    ],
  },
  {
    exerciseName: 'Leg Press',
    date: '2026-09-22',
    sets: [
      { weight: 335, reps: 12 },
      { weight: 315, reps: 14 },
    ],
  },
  {
    exerciseName: 'Seated Leg Curls',
    date: '2026-09-22',
    sets: [
      { weight: 90, reps: 8 },
      { weight: 85, reps: 8 },
    ],
  },
];

/**
 * Resolves or creates an exercise matching the given name, accounting for common aliases.
 */
async function resolveOrCreateExercise(exerciseName: string): Promise<number> {
  const trimmed = exerciseName.trim();

  // 1. Direct case-insensitive match
  const direct = await db.exercises.where('name').equalsIgnoreCase(trimmed).first();
  if (direct && direct.id) {
    return direct.id;
  }

  // 2. Alias mapping to link with default seed exercises
  const aliases: Record<string, string> = {
    'flat bench db press': 'Flat Dumbbell Bench Press',
    'lateral raises (db)': 'DB Lateral Raises',
    'bicep curls (db)': 'DB Bicep Curls',
  };

  const aliasTarget = aliases[trimmed.toLowerCase()];
  if (aliasTarget) {
    const aliased = await db.exercises.where('name').equalsIgnoreCase(aliasTarget).first();
    if (aliased && aliased.id) {
      return aliased.id;
    }
  }

  // 3. Fallback: Create new exercise entry
  const muscleGroupsMap: Record<string, string> = {
    'flat bench db press': 'Chest, Shoulders, Triceps',
    'lateral raises (db)': 'Side Deltoids, Shoulders',
    'bicep curls (db)': 'Biceps, Forearms',
    'lat pulldowns': 'Lats, Upper Back, Biceps',
    'leg press': 'Quadriceps, Glutes',
    'seated leg curls': 'Hamstrings',
  };

  const id = await db.exercises.add({
    name: trimmed,
    muscle_groups: muscleGroupsMap[trimmed.toLowerCase()] || 'Full Body',
  });

  return Number(id);
}

/**
 * Removes any unwanted 'Full Body Routine' from workouts list
 * and re-links any sessions to a canonical routine.
 */
export async function cleanupFullBodyRoutine(): Promise<void> {
  try {
    const fbr = await db.workouts.where('name').equalsIgnoreCase('Full Body Routine').first();
    if (fbr && fbr.id) {
      const canonical = await db.workouts.where('name').equalsIgnoreCase('Full Body A (2 Sets to 0 RIR)').first();
      const fallback = canonical || (await db.workouts.toCollection().first());
      const targetId = fallback?.id || 1;

      // Re-map any sessions to target routine
      const fbrSessions = await db.sessions.where('workout_id').equals(fbr.id).toArray();
      for (const s of fbrSessions) {
        if (s.id) {
          await db.sessions.update(s.id, { workout_id: targetId });
        }
      }

      // Delete from workout_exercises and workouts
      await db.workout_exercises.where('workout_id').equals(fbr.id).delete();
      await db.workouts.delete(fbr.id);
    }
  } catch (err) {
    console.warn('cleanupFullBodyRoutine:', err);
  }
}

const SEED_FLAG_KEY = 'gymapp_dummy_workouts_seeded_1year_v3';

// Dates from the previous single-month seed to purge
const OLD_SHORT_DATES = [
  '2026-08-24',
  '2026-08-28',
  '2026-09-01',
  '2026-09-04',
  '2026-09-08',
  '2026-09-11',
  '2026-09-18',
];

/**
 * Seeds the 1-year progressive overload dummy workouts into Dexie DB.
 */
export async function seedDummyWorkouts(): Promise<number> {
  await cleanupFullBodyRoutine();

  if (typeof window !== 'undefined' && localStorage.getItem(SEED_FLAG_KEY) === 'true') {
    return 0;
  }

  // Purge the old single-month cluster sessions so they are replaced by the 1-year timeline
  try {
    for (const oldDate of OLD_SHORT_DATES) {
      const oldSessions = await db.sessions.filter((s) => s.date.startsWith(oldDate)).toArray();
      for (const s of oldSessions) {
        if (s.id) {
          await db.session_sets.where('session_id').equals(s.id).delete();
          await db.sessions.delete(s.id);
        }
      }
    }
  } catch (err) {
    console.warn('Failed to purge old cluster dates:', err);
  }

  // Link sessions to an existing routine like 'Full Body A (2 Sets to 0 RIR)'
  let workout = await db.workouts.where('name').equalsIgnoreCase('Full Body A (2 Sets to 0 RIR)').first();
  if (!workout) {
    workout = await db.workouts.toCollection().first();
  }

  const workoutId = workout?.id || 1;

  // Group raw items by date
  const sessionsByDate = new Map<string, RawDummyItem[]>();
  for (const item of DUMMY_WORKOUT_DATA) {
    const list = sessionsByDate.get(item.date) || [];
    list.push(item);
    sessionsByDate.set(item.date, list);
  }

  const exerciseIdCache = new Map<string, number>();
  let newlySeededCount = 0;

  for (const [dateStr, exerciseItems] of sessionsByDate.entries()) {
    const datePrefix = `${dateStr}T`;
    const existing = await db.sessions
      .filter((s) => s.date.startsWith(dateStr) || s.date.startsWith(datePrefix))
      .first();

    if (existing && existing.id) {
      continue;
    }

    const isoDate = `${dateStr}T12:00:00.000Z`;
    const sessionId = await db.sessions.add({
      workout_id: workoutId,
      date: isoDate,
    });

    for (const exItem of exerciseItems) {
      let exId = exerciseIdCache.get(exItem.exerciseName);
      if (!exId) {
        exId = await resolveOrCreateExercise(exItem.exerciseName);
        exerciseIdCache.set(exItem.exerciseName, exId);
      }

      for (let sIdx = 0; sIdx < exItem.sets.length; sIdx++) {
        const setInfo = exItem.sets[sIdx];
        await db.session_sets.add({
          session_id: Number(sessionId),
          exercise_id: exId,
          set_number: sIdx + 1,
          weight: setInfo.weight,
          reps: setInfo.reps,
          unit: 'lb' as WeightUnit,
        });
      }
    }

    newlySeededCount++;
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(SEED_FLAG_KEY, 'true');
  }

  return newlySeededCount;
}

export const DUMMY_BODY_METRICS: Array<{
  date: string;
  weight: number;
  unit: WeightUnit;
  bodyFatPercentage: number;
  notes?: string;
}> = [
  { date: '2025-09-28', weight: 91.8, unit: 'kg', bodyFatPercentage: 29.8, notes: 'Baseline check-in' },
  { date: '2025-10-12', weight: 90.6, unit: 'kg', bodyFatPercentage: 29.4 },
  { date: '2025-10-26', weight: 89.4, unit: 'kg', bodyFatPercentage: 29.0 },
  { date: '2025-11-09', weight: 88.1, unit: 'kg', bodyFatPercentage: 28.5 },
  { date: '2025-11-23', weight: 86.9, unit: 'kg', bodyFatPercentage: 28.1, notes: 'Cut phase progressing' },
  { date: '2025-12-07', weight: 85.6, unit: 'kg', bodyFatPercentage: 27.6 },
  { date: '2025-12-21', weight: 84.3, unit: 'kg', bodyFatPercentage: 27.2 },
  { date: '2026-01-04', weight: 83.0, unit: 'kg', bodyFatPercentage: 26.8, notes: 'Post-holidays check' },
  { date: '2026-01-18', weight: 81.6, unit: 'kg', bodyFatPercentage: 26.3 },
  { date: '2026-02-01', weight: 80.3, unit: 'kg', bodyFatPercentage: 25.8 },
  { date: '2026-02-15', weight: 79.1, unit: 'kg', bodyFatPercentage: 25.3 },
  { date: '2026-03-01', weight: 78.2, unit: 'kg', bodyFatPercentage: 24.9, notes: 'Lowest weight reached' },
  { date: '2026-03-15', weight: 78.7, unit: 'kg', bodyFatPercentage: 25.1 },
  { date: '2026-03-29', weight: 79.8, unit: 'kg', bodyFatPercentage: 25.5, notes: 'Lean bulk / strength focus' },
  { date: '2026-04-12', weight: 81.0, unit: 'kg', bodyFatPercentage: 26.0 },
  { date: '2026-04-26', weight: 82.4, unit: 'kg', bodyFatPercentage: 26.5 },
  { date: '2026-05-10', weight: 83.8, unit: 'kg', bodyFatPercentage: 27.0 },
  { date: '2026-05-24', weight: 85.1, unit: 'kg', bodyFatPercentage: 27.5, notes: 'Gym PRs increasing' },
  { date: '2026-06-07', weight: 86.4, unit: 'kg', bodyFatPercentage: 28.0 },
  { date: '2026-06-21', weight: 87.7, unit: 'kg', bodyFatPercentage: 28.4 },
  { date: '2026-07-05', weight: 88.9, unit: 'kg', bodyFatPercentage: 28.8 },
  { date: '2026-07-19', weight: 90.1, unit: 'kg', bodyFatPercentage: 29.2 },
  { date: '2026-08-02', weight: 91.0, unit: 'kg', bodyFatPercentage: 29.6 },
  { date: '2026-08-16', weight: 91.8, unit: 'kg', bodyFatPercentage: 29.9 },
  { date: '2026-08-30', weight: 92.2, unit: 'kg', bodyFatPercentage: 30.2, notes: 'Peak bulk check' },
  { date: '2026-09-10', weight: 91.0, unit: 'kg', bodyFatPercentage: 29.7 },
  { date: '2026-09-20', weight: 90.2, unit: 'kg', bodyFatPercentage: 29.4, notes: 'Current check-in' },
];

export async function seedDummyBodyMetrics(): Promise<number> {
  // Dummy body metrics seeding disabled by default so users start with a clean slate
  return 0;
}


