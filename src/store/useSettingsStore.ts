import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WeightUnit } from '../types';

interface SettingsState {
  unit: WeightUnit;
  setUnit: (unit: WeightUnit) => void;
  toggleUnit: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      unit: 'lb',
      setUnit: (unit) => set({ unit }),
      toggleUnit: () => set((state) => ({ unit: state.unit === 'kg' ? 'lb' : 'kg' })),
    }),
    {
      name: 'gymapp-settings',
    }
  )
);
