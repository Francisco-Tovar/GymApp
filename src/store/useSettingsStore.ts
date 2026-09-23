import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WeightUnit } from '../types';

interface SettingsState {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
  toggleUnit: () => void;
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

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      unit: 'lb',
      setUnit: (unit) => set({ unit }),
      toggleUnit: () => set((state) => ({ unit: state.unit === 'kg' ? 'lb' : 'kg' })),
    }),
    {
      name: 'gymapp-settings',
      storage: createJSONStorage(getStorage),
    }
  )
);
