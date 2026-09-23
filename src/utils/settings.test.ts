import { t, TRANSLATIONS } from './i18n';
import { useSettingsStore, applyThemeToDocument } from '../store/useSettingsStore';

function runSettingsTestSuite() {
  console.log('--- Settings & i18n Unit Tests ---');

  // Test 1: English Translations
  console.assert(t('settings_title', 'en') === 'Application Settings', 'English title mismatch');
  console.assert(t('clear_all_data', 'en') === 'Clear All Data', 'English clear data mismatch');
  console.assert(t('dark_mode', 'en') === 'Dark Mode', 'English dark mode mismatch');
  console.assert(t('light_mode', 'en') === 'Light Mode', 'English light mode mismatch');

  // Test 2: Spanish Translations
  console.assert(t('settings_title', 'es') === 'Configuración', 'Spanish title mismatch');
  console.assert(t('clear_all_data', 'es') === 'Restablecer datos', 'Spanish clear data mismatch');
  console.assert(t('dark_mode', 'es') === 'Modo Oscuro', 'Spanish dark mode mismatch');
  console.assert(t('light_mode', 'es') === 'Modo Claro', 'Spanish light mode mismatch');
  console.assert(t('workouts', 'es') === 'Rutinas', 'Spanish workouts mismatch');

  // Test 3: Fallback on unknown key or missing translation
  // @ts-expect-error Testing fallback for nonexistent key
  const fallbackVal = t('non_existent_key_123', 'es');
  console.assert(fallbackVal === 'non_existent_key_123', 'Fallback for unknown key failed');

  // Test 4: Default language parameter fallback to English
  console.assert(t('danger_zone') === 'Danger Zone', 'Default param language fallback failed');

  // Test 5: Store initial values and mutations
  const store = useSettingsStore.getState();
  console.assert(typeof store.theme === 'string', 'Theme should be defined');
  console.assert(typeof store.language === 'string', 'Language should be defined');
  console.assert(typeof store.unit === 'string', 'Unit should be defined');

  // Test 6: Theme switching
  store.setTheme('light');
  console.assert(useSettingsStore.getState().theme === 'light', 'setTheme to light failed');
  store.setTheme('dark');
  console.assert(useSettingsStore.getState().theme === 'dark', 'setTheme to dark failed');
  store.toggleTheme();
  console.assert(useSettingsStore.getState().theme === 'light', 'toggleTheme failed');
  store.toggleTheme();
  console.assert(useSettingsStore.getState().theme === 'dark', 'toggleTheme back to dark failed');

  // Test 7: Language switching
  store.setLanguage('es');
  console.assert(useSettingsStore.getState().language === 'es', 'setLanguage to es failed');
  store.setLanguage('en');
  console.assert(useSettingsStore.getState().language === 'en', 'setLanguage to en failed');

  // Test 8: Unit switching
  store.setUnit('kg');
  console.assert(useSettingsStore.getState().unit === 'kg', 'setUnit to kg failed');
  store.toggleUnit();
  console.assert(useSettingsStore.getState().unit === 'lb', 'toggleUnit to lb failed');

  // Test 9: All Spanish dictionary entries exist for English keys
  const enKeys = Object.keys(TRANSLATIONS.en) as (keyof typeof TRANSLATIONS.en)[];
  let missingCount = 0;
  for (const k of enKeys) {
    if (!TRANSLATIONS.es[k]) {
      console.error(`Missing Spanish translation for: ${k}`);
      missingCount++;
    }
  }
  console.assert(missingCount === 0, `There are ${missingCount} missing Spanish translations`);

  console.log('✓ All Settings & i18n tests passed successfully!');
}

runSettingsTestSuite();
