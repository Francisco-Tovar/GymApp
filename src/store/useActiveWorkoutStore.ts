import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exercise, WeightUnit } from '../types';
import { convertWeight } from '../utils/unitConversion';

export interface LocalSetState {
  id: string;
  weight: string;
  reps: string;
  durationMinutes?: string;
  durationSeconds?: string;
  notes?: string;
}

export interface ExerciseSetsMap {
  [exerciseId: number]: LocalSetState[];
}

interface ActiveWorkoutState {
  isActive: boolean;
  workoutId: number | null;
  workoutName: string;
  exercises: Exercise[];
  exerciseSetsMap: ExerciseSetsMap;
  currentDate: string;
  unit: WeightUnit;
  startTime: number | null;

  completedExerciseIds: number[];
  toggleExerciseCompleted: (exerciseId: number) => void;
  startWorkout: (
    workoutId: number,
    workoutName: string,
    exercises: Exercise[],
    initialSetsMap: ExerciseSetsMap,
    unit: WeightUnit
  ) => void;
  addSet: (exerciseId: number) => void;
  removeSet: (exerciseId: number, index: number) => void;
  updateSet: (
    exerciseId: number,
    index: number,
    field: 'weight' | 'reps' | 'durationMinutes' | 'durationSeconds' | 'notes',
    value: string
  ) => void;
  setExercises: (exercises: Exercise[]) => void;
  moveExerciseUp: (index: number) => void;
  moveExerciseDown: (index: number) => void;
  convertUnit: (toUnit: WeightUnit) => void;
  clearActiveWorkout: () => void;
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>()(
  persist(
    (set, get) => ({
      isActive: false,
      workoutId: null,
      workoutName: '',
      exercises: [],
      exerciseSetsMap: {},
      currentDate: new Date().toISOString(),
      unit: 'lb',
      startTime: null,
      completedExerciseIds: [],

      toggleExerciseCompleted: (exerciseId: number) => {
        const current = get().completedExerciseIds || [];
        if (current.includes(exerciseId)) {
          set({ completedExerciseIds: current.filter((id) => id !== exerciseId) });
        } else {
          set({ completedExerciseIds: [...current, exerciseId] });
        }
      },

      startWorkout: (workoutId, workoutName, exercises, initialSetsMap, unit) => {
        set({
          isActive: true,
          workoutId,
          workoutName,
          exercises,
          exerciseSetsMap: initialSetsMap,
          currentDate: new Date().toISOString(),
          unit,
          startTime: Date.now(),
          completedExerciseIds: [],
        });
      },

      addSet: (exerciseId) => {
        // Prevent adding sets if exercise is completed
        if ((get().completedExerciseIds || []).includes(exerciseId)) {
          return;
        }
        const currentSets = get().exerciseSetsMap[exerciseId] || [];
        const lastSet = currentSets.length > 0 ? currentSets[currentSets.length - 1] : null;
        const lastWeight = lastSet ? lastSet.weight : '0';
        const lastMinutes = lastSet?.durationMinutes || '0';
        const lastSeconds = lastSet?.durationSeconds || '0';
        const newSet: LocalSetState = {
          id: (currentSets.length + 1).toString() + '-' + Date.now(),
          weight: lastWeight,
          reps: '0',
          durationMinutes: lastMinutes,
          durationSeconds: lastSeconds,
          notes: '',
        };
        set((state) => ({
          exerciseSetsMap: {
            ...state.exerciseSetsMap,
            [exerciseId]: [...currentSets, newSet],
          },
        }));
      },

      removeSet: (exerciseId, index) => {
        const currentSets = get().exerciseSetsMap[exerciseId] || [];
        const updated = currentSets.filter((_, i) => i !== index);
        set((state) => ({
          exerciseSetsMap: {
            ...state.exerciseSetsMap,
            [exerciseId]: updated,
          },
        }));
      },

      updateSet: (exerciseId, index, field, value) => {
        const currentSets = get().exerciseSetsMap[exerciseId] || [];
        const updated = [...currentSets];
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            [field]: value,
          };
        }
        set((state) => ({
          exerciseSetsMap: {
            ...state.exerciseSetsMap,
            [exerciseId]: updated,
          },
        }));
      },

      setExercises: (exercises) => set({ exercises }),

      moveExerciseUp: (index) => {
        if (index <= 0) return;
        const list = [...get().exercises];
        const temp = list[index];
        list[index] = list[index - 1];
        list[index - 1] = temp;
        set({ exercises: list });
      },

      moveExerciseDown: (index) => {
        const list = [...get().exercises];
        if (index >= list.length - 1) return;
        const temp = list[index];
        list[index] = list[index + 1];
        list[index + 1] = temp;
        set({ exercises: list });
      },

      convertUnit: (toUnit: WeightUnit) => {
        const currentUnit = get().unit;
        if (currentUnit === toUnit) return;
        const oldMap = get().exerciseSetsMap;
        const newMap: ExerciseSetsMap = {};

        for (const [exId, sets] of Object.entries(oldMap)) {
          newMap[Number(exId)] = (sets as LocalSetState[]).map((s: LocalSetState) => {
            const num = parseFloat(s.weight);
            if (isNaN(num) || num === 0) return s;
            const converted = convertWeight(num, currentUnit, toUnit);
            return {
              ...s,
              weight: converted.toString(),
            };
          });
        }

        set({
          unit: toUnit,
          exerciseSetsMap: newMap,
        });
      },

      clearActiveWorkout: () => {
        set({
          isActive: false,
          workoutId: null,
          workoutName: '',
          exercises: [],
          exerciseSetsMap: {},
          completedExerciseIds: [],
          currentDate: new Date().toISOString(),
          startTime: null,
        });
      },
    }),
    {
      name: 'gymapp-active-workout',
    }
  )
);
