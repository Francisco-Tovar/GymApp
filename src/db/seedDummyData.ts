import { db } from './db';
import { WeightUnit } from '../types';

export interface RawDummyItem {
  exerciseName: string;
  date: string;
  sets: Array<{ weight: number; reps: number }>;
}

export const DUMMY_WORKOUT_DATA: RawDummyItem[] = [];

/**
 * Removes any unwanted 'Full Body Routine' from workouts list
 * and re-links any sessions to a canonical routine.
 */
export async function cleanupFullBodyRoutine(): Promise<void> {
  try {
    const fbr = await db.workouts.where('name').equalsIgnoreCase('Full Body Routine').first();
    if (fbr && fbr.id) {
      const canonical = await db.workouts.where('name').equalsIgnoreCase('Full Body Tuesday').first();
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

/**
 * Dummy workouts seeding disabled to ensure clean user data.
 */
export async function seedDummyWorkouts(): Promise<number> {
  return 0;
}

export const DUMMY_BODY_METRICS: Array<{
  date: string;
  weight: number;
  unit: WeightUnit;
  bodyFatPercentage: number;
  notes?: string;
}> = [];

/**
 * Dummy body metrics seeding disabled.
 */
export async function seedDummyBodyMetrics(): Promise<number> {
  return 0;
}
