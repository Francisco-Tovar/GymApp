import { create } from 'zustand';
import { Exercise } from '../types';

export interface LocalSetState {
  id: string;
  weight: string;
  reps: string;
}

interface ExerciseSetsMap {
  [exerciseId: number]: LocalSetState[];
}

interface ActiveSessionState {
  isActive: boolean;
  workoutId: number | null;
  workoutName: string | null;
  exercises: Exercise[];
  exerciseSetsMap: ExerciseSetsMap;
  sessionDate: string | null;

  startSession: (workoutId: number, workoutName: string, exercises: Exercise[], setsMap: ExerciseSetsMap) => void;
  clearSession: () => void;
  setExercises: (exercises: Exercise[]) => void;
  setExerciseSetsMap: (setsMap: ExerciseSetsMap) => void;
  updateExerciseSetsMap: (updater: (prev: ExerciseSetsMap) => ExerciseSetsMap) => void;
}

export const useActiveSessionStore = create<ActiveSessionState>((set) => ({
  isActive: false,
  workoutId: null,
  workoutName: null,
  exercises: [],
  exerciseSetsMap: {},
  sessionDate: null,

  startSession: (workoutId, workoutName, exercises, setsMap) =>
    set({
      isActive: true,
      workoutId,
      workoutName,
      exercises,
      exerciseSetsMap: setsMap,
      sessionDate: new Date().toISOString(),
    }),

  clearSession: () =>
    set({
      isActive: false,
      workoutId: null,
      workoutName: null,
      exercises: [],
      exerciseSetsMap: {},
      sessionDate: null,
    }),

  setExercises: (exercises) => set({ exercises }),

  setExerciseSetsMap: (setsMap) => set({ exerciseSetsMap: setsMap }),

  updateExerciseSetsMap: (updater) =>
    set((state) => ({ exerciseSetsMap: updater(state.exerciseSetsMap) })),
}));
