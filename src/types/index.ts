export type WeightUnit = 'lb' | 'kg';
export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'en' | 'es';
export type FontSize = 'small' | 'medium' | 'large';

export type ExerciseType = 'weight_reps' | 'time_based';

export interface Exercise {
  id?: number;
  name: string;
  muscle_groups: string;
  exercise_type?: ExerciseType;
  imageUrl?: string | null;
  notes?: string | null;
}

export interface Workout {
  id: number;
  name: string;
  exercises?: Exercise[];
  exercise_ids?: number[];
}

export interface Session {
  id: number;
  workout_id: number;
  workout_name?: string;
  date: string;
  total_sets?: number;
}

export interface SessionSet {
  id?: number;
  session_id?: number;
  exercise_id: number;
  exercise_name?: string;
  set_number: number;
  weight: number;
  reps: number;
  unit: WeightUnit;
  exercise_type?: ExerciseType;
  duration_seconds?: number;
  notes?: string | null;
}

export interface WorkoutExercise {
  id?: number;
  workout_id: number;
  exercise_id: number;
}

export type Gender = 'male' | 'female' | 'other' | 'unspecified';
export type HeightUnit = 'cm' | 'ft_in';

export interface UserProfile {
  id?: number;
  name?: string;
  dob?: string; // YYYY-MM-DD
  gender?: Gender;
  heightCm?: number; // stored internally in cm
  heightUnit?: HeightUnit;
}

export interface BodyMetricLog {
  id?: number;
  date: string; // ISO string (e.g. 2026-09-23T12:00:00.000Z or YYYY-MM-DD)
  weight: number;
  unit: WeightUnit;
  bodyFatPercentage?: number | null;
  notes?: string | null;
}
