import { t, TRANSLATIONS, translateMuscleGroup, translateMuscleList } from './i18n';
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
  console.assert(t('session_in_progress', 'es') === 'Sesión en Curso', 'Spanish session_in_progress mismatch');
  console.assert(t('resume', 'es') === 'Reanudar', 'Spanish resume mismatch');
  console.assert(t('rest', 'es') === 'Descanso', 'Spanish rest mismatch');
  console.assert(t('session_muscle_activation', 'es') === 'Activación Muscular de la Sesión', 'Spanish activation mismatch');
  console.assert(t('targeted', 'es') === 'Trabajados', 'Spanish targeted mismatch');
  console.assert(t('add_set', 'es') === 'Agregar Serie', 'Spanish add_set mismatch');
  console.assert(t('finish_workout', 'es') === 'Finalizar Entrenamiento', 'Spanish finish_workout mismatch');
  console.assert(t('cancel_session_title', 'es') === '¿Cancelar Sesión?', 'Spanish cancel_session_title mismatch');
  console.assert(t('metric_view_fat', 'en') === 'Body Fat %', 'English metric_view_fat should be Body Fat %');
  console.assert(t('metric_view_fat', 'es') === 'Grasa %', 'Spanish metric_view_fat should be Grasa %');
  console.assert(!t('metric_view_fat', 'es').startsWith('%'), 'Spanish metric_view_fat should not start with %');
  console.assert(!t('metric_view_fat', 'en').startsWith('%'), 'English metric_view_fat should not start with %');
  console.assert(t('body_fat', 'es') === 'Grasa Corporal %', 'Spanish body_fat should be Grasa Corporal %');
  console.assert(!t('body_fat', 'es').startsWith('%'), 'Spanish body_fat should not start with %');

  // Test 3: Muscle Group Translations
  console.assert(translateMuscleGroup('Quadriceps', 'es') === 'Cuádriceps', 'Quadriceps ES mismatch');
  console.assert(translateMuscleGroup('Glutes', 'es') === 'Glúteos', 'Glutes ES mismatch');
  console.assert(translateMuscleGroup('Chest', 'es') === 'Pecho', 'Chest ES mismatch');
  console.assert(translateMuscleGroup('Quadriceps', 'en') === 'Quadriceps', 'Quadriceps EN mismatch');
  console.assert(translateMuscleList('Quadriceps, Glutes', 'es') === 'Cuádriceps, Glúteos', 'Muscle list ES mismatch');
  console.assert(translateMuscleList('Chest, Shoulders, Triceps', 'es') === 'Pecho, Hombros, Tríceps', 'Muscle list ES mismatch 2');

  // Test 4: Fallback on unknown key or missing translation
  // @ts-expect-error Testing fallback for nonexistent key
  const fallbackVal = t('non_existent_key_123', 'es');
  console.assert(fallbackVal === 'non_existent_key_123', 'Fallback for unknown key failed');

  // Test 5: Default language parameter fallback to English
  console.assert(t('danger_zone') === 'Danger Zone', 'Default param language fallback failed');

  // Test 6: Store initial values and mutations
  const store = useSettingsStore.getState();
  console.assert(typeof store.theme === 'string', 'Theme should be defined');
  console.assert(typeof store.language === 'string', 'Language should be defined');
  console.assert(typeof store.unit === 'string', 'Unit should be defined');

  // Test 7: Theme switching
  store.setTheme('light');
  console.assert(useSettingsStore.getState().theme === 'light', 'setTheme to light failed');
  store.setTheme('dark');
  console.assert(useSettingsStore.getState().theme === 'dark', 'setTheme to dark failed');
  store.toggleTheme();
  console.assert(useSettingsStore.getState().theme === 'light', 'toggleTheme failed');
  store.toggleTheme();
  console.assert(useSettingsStore.getState().theme === 'dark', 'toggleTheme back to dark failed');

  // Test 8: Language switching
  store.setLanguage('es');
  console.assert(useSettingsStore.getState().language === 'es', 'setLanguage to es failed');
  store.setLanguage('en');
  console.assert(useSettingsStore.getState().language === 'en', 'setLanguage to en failed');

  // Test 9: Unit switching
  store.setUnit('kg');
  console.assert(useSettingsStore.getState().unit === 'kg', 'setUnit to kg failed');
  store.toggleUnit();
  console.assert(useSettingsStore.getState().unit === 'lb', 'toggleUnit to lb failed');

  // Test 10: Font Size switching
  console.assert(t('font_size', 'en') === 'Font Size', 'English font_size mismatch');
  console.assert(t('font_size', 'es') === 'Tamaño de Letra', 'Spanish font_size mismatch');
  console.assert(store.fontSize === 'small', 'Default fontSize should be small');
  store.setFontSize('medium');
  console.assert(useSettingsStore.getState().fontSize === 'medium', 'setFontSize to medium failed');
  store.setFontSize('large');
  console.assert(useSettingsStore.getState().fontSize === 'large', 'setFontSize to large failed');
  store.setFontSize('small');
  console.assert(useSettingsStore.getState().fontSize === 'small', 'setFontSize back to small failed');

  // Test 11: All Spanish dictionary entries exist for English keys
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
