import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { WeightUnit, AppTheme, AppLanguage, FontSize } from '../types';

interface SettingsState {
  unit: WeightUnit;
  theme: AppTheme;
  language: AppLanguage;
  fontSize: FontSize;
  setUnit: (unit: WeightUnit) => void;
  toggleUnit: () => void;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setLanguage: (language: AppLanguage) => void;
  setFontSize: (fontSize: FontSize) => void;
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

export function applyFontSizeToDocument(fontSize: FontSize): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-font-size', fontSize);
  root.classList.remove('font-small', 'font-medium', 'font-large');
  root.classList.add(`font-${fontSize}`);
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      unit: 'lb',
      theme: 'dark',
      language: 'en',
      fontSize: 'small',
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
      setFontSize: (fontSize) => {
        applyFontSizeToDocument(fontSize);
        set({ fontSize });
      },
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
          applyFontSizeToDocument(state.fontSize || 'small');
        }
      },
    }
  )
);

// Apply initial theme & font size immediately to prevent Flash Of Unstyled Content
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem('gymapp-settings');
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedTheme: AppTheme = parsed?.state?.theme || 'dark';
      const savedFontSize: FontSize = parsed?.state?.fontSize || 'small';
      applyThemeToDocument(savedTheme);
      applyFontSizeToDocument(savedFontSize);
    } else {
      applyThemeToDocument('dark');
      applyFontSizeToDocument('small');
    }
  } catch {
    applyThemeToDocument('dark');
    applyFontSizeToDocument('small');
  }
}

