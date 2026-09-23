export type WeightUnit = 'lb' | 'kg';

export interface Exercise {
  id?: number;
  name: string;
  muscle_groups: string;
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
}

export interface WorkoutExercise {
  id?: number;
  workout_id: number;
  exercise_id: number;
}
