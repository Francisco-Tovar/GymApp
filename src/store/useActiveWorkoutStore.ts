import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Exercise, WeightUnit } from '../types';
import { LocalSetState } from '../components/organisms/ActiveSetLogger';
import { convertWeight } from '../utils/unitConversion';

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
    field: 'weight' | 'reps',
    value: string
  ) => void;
  setExercises: (exercises: Exercise[]) => void;
  moveExerciseUp: (index: number) => void;
  moveExerciseDown: (index: number) => void;
  convertUnit: (toUnit: WeightUnit) => void;
  clearActiveWorkout: () => void;
}

const dummyStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

const getStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return dummyStorage;
};

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

      startWorkout: (workoutId, workoutName, exercises, initialSetsMap, unit) => {
        set({
          isActive: true,
          workoutId,
          workoutName,
          exercises,
          exerciseSetsMap: initialSetsMap,
          currentDate: new Date().toISOString(),
          unit,
        });
      },

      addSet: (exerciseId) => {
        const currentSets = get().exerciseSetsMap[exerciseId] || [];
        const lastWeight = currentSets.length > 0 ? currentSets[currentSets.length - 1].weight : '0';
        const newSet: LocalSetState = {
          id: (currentSets.length + 1).toString() + '-' + Date.now(),
          weight: lastWeight,
          reps: '0',
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
          currentDate: new Date().toISOString(),
        });
      },
    }),
    {
      name: 'gymapp-active-workout',
      storage: createJSONStorage(getStorage),
    }
  )
);
