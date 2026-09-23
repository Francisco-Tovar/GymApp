import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WeightUnit, AppTheme, AppLanguage } from '../types';

interface SettingsState {
  unit: WeightUnit;
  theme: AppTheme;
  language: AppLanguage;
  setUnit: (unit: WeightUnit) => void;
  toggleUnit: () => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setLanguage: (language: AppLanguage) => void;
}

export function applyThemeToDocument(theme: AppTheme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.classList.remove('dark', 'light');
  root.classList.add(theme);

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute('content', theme === 'dark' ? '#0f172a' : '#ffffff');
  }
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      unit: 'lb',
      theme: 'dark',
      language: 'en',
      setUnit: (unit) => set({ unit }),
      toggleUnit: () => set((state) => ({ unit: state.unit === 'kg' ? 'lb' : 'kg' })),
      setTheme: (theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const next = get().theme === 'dark' ? 'light' : 'dark';
        applyThemeToDocument(next);
        set({ theme: next });
      },
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'gymapp-settings',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyThemeToDocument(state.theme || 'dark');
        }
      },
    }
  )
);

// Apply initial theme immediately to prevent Flash Of Unstyled Theme (FOUT)
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('gymapp-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedTheme: AppTheme = parsed?.state?.theme || 'dark';
      applyThemeToDocument(savedTheme);
    } else {
      applyThemeToDocument('dark');
    }
  } catch {
    applyThemeToDocument('dark');
  }
}
