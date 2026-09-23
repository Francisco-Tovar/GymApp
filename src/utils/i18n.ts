import { AppLanguage } from '../types';

export const TRANSLATIONS = {
  en: {
    // Navigation & Common
    app_title: 'GymApp PWA',
    workouts: 'Workouts',
    exercises: 'Exercises',
    history: 'History',
    settings: 'Settings',
    offline: 'Offline',
    loading: 'Loading...',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    edit: 'Edit',
    back: 'Back',
    all: 'All',

    // Header actions
    unit_lb: 'LB',
    unit_kg: 'KG',
    toggle_unit: 'Toggle Weight Unit (LB / KG)',
    open_settings: 'Open Settings',

    // Workout Screen
    my_workouts: 'My Routines',
    workout_routines: 'Workout Routines',
    start: 'Start',
    start_workout: 'Start Workout',
    new_routine: 'New Routine',
    progression: 'Progression',
    no_workouts_found: 'No Workouts Found',
    create_first_routine: 'Create First Routine',
    routines_configured: 'routine(s) configured',

    // History Screen & Analytics Tabs
    workout_history: 'Workout History',
    completed_sessions: 'completed session(s) recorded',
    progressive_overload: 'Progressive Overload',
    workout_logs: 'Workout Logs',
    routines: 'Routines',
    no_completed_sessions: 'No Completed Sessions',
    first_workout_prompt: 'Complete your first workout routine to view training logs and progress here.',

    // Progressive Overload & Charts
    relative_growth: 'Relative Growth (%)',
    estimated_1rm: 'Estimated 1RM',
    top_set_load: 'Top Set Load',
    total_volume: 'Total Volume',
    tracked_lifts: 'Tracked Lifts',
    timeline_span: 'Timeline Span',
    top_gainer: 'Top Gainer',
    select_all: 'Select All',
    deselect_all: 'Deselect All',
    select_exercise_placeholder: 'Select an exercise...',
    all_routine_workouts: 'All Routine Workouts',
    baseline_indicator: '100% Baseline',
    skipped_session: 'Skipped / Not logged',

    // Settings Modal
    settings_title: 'Application Settings',
    settings_subtitle: 'Manage theme, language, and system data preferences',
    theme: 'Theme',
    dark_mode: 'Dark Mode',
    light_mode: 'Light Mode',
    language: 'Language',
    weight_unit: 'Default Weight Unit',
    pounds: 'Pounds (LB)',
    kilograms: 'Kilograms (KG)',

    // Danger Zone
    danger_zone: 'Danger Zone',
    danger_zone_desc: 'Actions in this area are irreversible and affect all stored data.',
    clear_all_data: 'Clear All Data',
    clear_all_data_desc: 'Permanently erase all logged sessions, custom routines, and exercise histories.',
    wipe_confirm_title: 'Wipe All Application Data?',
    wipe_confirm_desc: 'Are you sure you want to permanently wipe all recorded workout history and custom routines? This action cannot be undone.',
    confirm_wipe_button: 'Confirm Wipe',
    data_wiped_success: 'All workout data has been cleared and reset to initial routines.',
  },
  es: {
    // Navigation & Common
    app_title: 'GymApp PWA',
    workouts: 'Rutinas',
    exercises: 'Ejercicios',
    history: 'Historial',
    settings: 'Configuración',
    offline: 'Sin conexión',
    loading: 'Cargando...',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    close: 'Cerrar',
    edit: 'Editar',
    back: 'Volver',
    all: 'Todo',

    // Header actions
    unit_lb: 'LB',
    unit_kg: 'KG',
    toggle_unit: 'Cambiar Unidad (LB / KG)',
    open_settings: 'Abrir Configuración',

    // Workout Screen
    my_workouts: 'Mis Rutinas',
    workout_routines: 'Rutinas de Entrenamiento',
    start: 'Iniciar',
    start_workout: 'Comenzar',
    new_routine: 'Nueva Rutina',
    progression: 'Progresión',
    no_workouts_found: 'No se encontraron rutinas',
    create_first_routine: 'Crear Primera Rutina',
    routines_configured: 'rutina(s) configurada(s)',

    // History Screen & Analytics Tabs
    workout_history: 'Historial de Entrenamiento',
    completed_sessions: 'sesión(es) completada(s) registrada(s)',
    progressive_overload: 'Sobrecarga Progresiva',
    workout_logs: 'Registros de Sesiones',
    routines: 'Rutinas',
    no_completed_sessions: 'Sin Sesiones Completadas',
    first_workout_prompt: 'Completa tu primer entrenamiento para visualizar tus registros y progreso aquí.',

    // Progressive Overload & Charts
    relative_growth: 'Crecimiento Relativo (%)',
    estimated_1rm: '1RM Estimado',
    top_set_load: 'Carga Serie Principal',
    total_volume: 'Volumen Total',
    tracked_lifts: 'Ejercicios Registrados',
    timeline_span: 'Línea Temporal',
    top_gainer: 'Mayor Progreso',
    select_all: 'Seleccionar Todo',
    deselect_all: 'Deseleccionar Todo',
    select_exercise_placeholder: 'Selecciona un ejercicio...',
    all_routine_workouts: 'Todas las Rutinas',
    baseline_indicator: '100% Base Inicial',
    skipped_session: 'No realizado',

    // Settings Modal
    settings_title: 'Configuración',
    settings_subtitle: 'Administra tema, idioma y preferencias de datos',
    theme: 'Tema',
    dark_mode: 'Modo Oscuro',
    light_mode: 'Modo Claro',
    language: 'Idioma',
    weight_unit: 'Unidad de Peso',
    pounds: 'Libras (LB)',
    kilograms: 'Kilogramos (KG)',

    // Danger Zone
    danger_zone: 'Zona de Peligro',
    danger_zone_desc: 'Las acciones en esta área son irreversibles y afectan todos los datos almacenados.',
    clear_all_data: 'Restablecer datos',
    clear_all_data_desc: 'Borra permanentemente todas las sesiones registradas, rutinas y registros de ejercicios.',
    wipe_confirm_title: '¿Restablecer todos los datos?',
    wipe_confirm_desc: '¿Estás seguro de que deseas borrar permanentemente todo tu historial de entrenamientos y rutinas? Esta acción no se puede deshacer.',
    confirm_wipe_button: 'Confirmar y Borrar',
    data_wiped_success: 'Todos los datos de entrenamiento han sido restablecidos.',
  },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS.en;

export function t(key: TranslationKey, language: AppLanguage = 'en'): string {
  const langDict = TRANSLATIONS[language] || TRANSLATIONS.en;
  return langDict[key] || TRANSLATIONS.en[key] || key;
}
