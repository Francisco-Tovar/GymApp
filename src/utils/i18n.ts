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
    saving: 'Saving...',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    close: 'Close',
    edit: 'Edit',
    back: 'Back',
    all: 'All',
    add: 'Add',

    // Header actions
    unit_lb: 'LB',
    unit_kg: 'KG',
    toggle_unit: 'Toggle Weight Unit (LB / KG)',
    open_settings: 'Open Settings',

    // Active Workout Banner
    session_in_progress: 'Session In Progress',
    resume: 'Resume',

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
    delete_workout_title: 'Delete Workout Routine?',
    delete_workout_desc: 'Are you sure you want to delete this routine? This will remove the routine from your list.',

    // Active Session Screen
    screen_awake: 'Screen Awake',
    rest: 'Rest',
    off: 'Off',
    reset: 'Reset',
    session_muscle_activation: 'Session Muscle Activation',
    targeted: 'Targeted',
    show: 'Show',
    hide: 'Hide',
    add_set: 'Add Set',
    finish_workout: 'Finish Workout',
    sets: 'set(s)',
    total_reps: 'total reps',
    no_sets_recorded: 'No sets recorded yet.',
    cancel_session_title: 'Cancel Session?',
    cancel_session_desc: 'Are you sure you want to discard this workout? Any unlogged sets will be lost.',
    keep_going: 'Keep Going',
    discard_workout: 'Discard Workout',

    // Body Muscle Map
    both: 'Both',
    front: 'Front',
    back_view: 'Back',
    muscle_map_help: 'Select exercises below to light up targeted muscle groups on the body map.',

    // Routine Builder Modal
    create_routine: 'Create Routine',
    edit_routine: 'Edit Routine',
    routine_name: 'Routine Name',
    routine_name_placeholder: 'e.g. Upper Body Hypertrophy',
    routine_muscle_coverage: 'Routine Muscle Coverage',
    routine_order: 'Routine Order',
    select_exercises_library: 'Select Exercises from Library',
    search_exercises_placeholder: 'Search exercises by name or muscle...',
    save_routine: 'Save Routine',
    update_routine: 'Update Routine',

    // Exercise Library Screen & Modal
    exercise_library: 'Exercise Library',
    movements_available: 'movements available',
    add_exercise: 'Add Exercise',
    search_movements_placeholder: 'Search movements or muscles...',
    no_movements_found: 'No Movements Found',
    no_movements_desc: 'Try adjusting your search filter or add a new exercise to your library.',
    edit_exercise: 'Edit Exercise',
    delete_exercise: 'Delete Exercise',
    delete_exercise_title: 'Delete Exercise?',
    delete_exercise_desc: 'Are you sure you want to remove this exercise? It will also be removed from any workouts and history.',
    add_new_exercise: 'Add New Exercise',
    exercise_name: 'Exercise Name',
    exercise_name_placeholder: 'e.g. Bulgarian Split Squat',
    target_muscle_groups: 'Targeted Muscle Groups',
    custom_muscle_placeholder: 'Custom muscle (e.g. Brachialis)...',
    create_exercise: 'Create Exercise',
    save_changes: 'Save Changes',

    // History Screen & Analytics Tabs
    workout_history: 'Workout History',
    completed_sessions: 'completed session(s) recorded',
    progressive_overload: 'Progressive Overload',
    workout_logs: 'Workout Logs',
    routines: 'Routines',
    no_completed_sessions: 'No Completed Sessions',
    first_workout_prompt: 'Complete your first workout routine to view training logs and progress here.',

    // Progressive Overload & Charts
    routine_progression_overload: 'Routine Progression Overload',
    routine_progression_subtitle: 'Track all movements simultaneously across the shared routine timeline',
    relative_growth: 'Relative Growth (%)',
    estimated_1rm: 'Estimated 1RM',
    top_set_load: 'Top Set Load',
    total_volume: 'Total Volume',
    tracked_lifts: 'Tracked Lifts',
    timeline_span: 'Timeline Span',
    top_gainer: 'Top Gainer',
    visible: 'visible',
    sessions: 'sessions',
    session: 'Session',
    select_all: 'Select All',
    deselect_all: 'Deselect All',
    select_exercise_placeholder: 'Select an exercise...',
    all_routine_workouts: 'All Routine Workouts',
    baseline_indicator: '100% Baseline',
    skipped_session: 'Skipped / Not logged',
    exercises_legend: 'EXERCISES LEGEND',
    legend_tip: '(Tap to toggle · Double-tap to isolate)',
    no_routine_sessions: 'No Routine Sessions Logged Yet',
    no_routine_sessions_desc: 'Complete workouts under this routine to unlock multi-movement progression tracking.',
    all_lines_hidden: 'All Exercise Lines Hidden',
    all_lines_hidden_desc: 'Select an exercise tag from the legend below or click "Select All" to view progress.',
    show_all_lines: 'Show All Lines',
    session_details: 'Session Details',
    click_graph_hint: 'Click or tap on the graph to view session details in fullscreen',
    previous_session: 'Previous Session',
    next_session: 'Next Session',

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
    saving: 'Guardando...',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    close: 'Cerrar',
    edit: 'Editar',
    back: 'Volver',
    all: 'Todos',
    add: 'Añadir',

    // Header actions
    unit_lb: 'LB',
    unit_kg: 'KG',
    toggle_unit: 'Cambiar Unidad (LB / KG)',
    open_settings: 'Abrir Configuración',

    // Active Workout Banner
    session_in_progress: 'Sesión en Curso',
    resume: 'Reanudar',

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
    delete_workout_title: '¿Eliminar Rutina?',
    delete_workout_desc: '¿Estás seguro de que deseas eliminar esta rutina? Se eliminará de tu lista.',

    // Active Session Screen
    screen_awake: 'Pantalla Activa',
    rest: 'Descanso',
    off: 'Desactivado',
    reset: 'Reiniciar',
    session_muscle_activation: 'Activación Muscular de la Sesión',
    targeted: 'Trabajados',
    show: 'Mostrar',
    hide: 'Ocultar',
    add_set: 'Agregar Serie',
    finish_workout: 'Finalizar Entrenamiento',
    sets: 'serie(s)',
    total_reps: 'reps totales',
    no_sets_recorded: 'Aún no hay series registradas.',
    cancel_session_title: '¿Cancelar Sesión?',
    cancel_session_desc: '¿Estás seguro de que deseas descartar este entrenamiento? Las series no guardadas se perderán.',
    keep_going: 'Continuar',
    discard_workout: 'Descartar Entrenamiento',

    // Body Muscle Map
    both: 'Ambos',
    front: 'Frente',
    back_view: 'Espalda',
    muscle_map_help: 'Selecciona ejercicios a continuación para iluminar los grupos musculares en el mapa corporal.',

    // Routine Builder Modal
    create_routine: 'Crear Rutina',
    edit_routine: 'Editar Rutina',
    routine_name: 'Nombre de la Rutina',
    routine_name_placeholder: 'ej. Hipertrofia Tren Superior',
    routine_muscle_coverage: 'Cobertura Muscular de la Rutina',
    routine_order: 'Orden de la Rutina',
    select_exercises_library: 'Seleccionar Ejercicios de la Biblioteca',
    search_exercises_placeholder: 'Buscar ejercicios por nombre o músculo...',
    save_routine: 'Guardar Rutina',
    update_routine: 'Actualizar Rutina',

    // Exercise Library Screen & Modal
    exercise_library: 'Biblioteca de Ejercicios',
    movements_available: 'ejercicios disponibles',
    add_exercise: 'Nuevo Ejercicio',
    search_movements_placeholder: 'Buscar movimientos o músculos...',
    no_movements_found: 'No se encontraron ejercicios',
    no_movements_desc: 'Prueba ajustando tu búsqueda o crea un nuevo ejercicio.',
    edit_exercise: 'Editar Ejercicio',
    delete_exercise: 'Eliminar Ejercicio',
    delete_exercise_title: '¿Eliminar Ejercicio?',
    delete_exercise_desc: '¿Estás seguro de que deseas eliminar este ejercicio? Se eliminará de tus rutinas e historial.',
    add_new_exercise: 'Añadir Nuevo Ejercicio',
    exercise_name: 'Nombre del Ejercicio',
    exercise_name_placeholder: 'ej. Sentadilla Búlgara',
    target_muscle_groups: 'Grupos Musculares Objetivo',
    custom_muscle_placeholder: 'Músculo personalizado (ej. Braquial)...',
    create_exercise: 'Crear Ejercicio',
    save_changes: 'Guardar Cambios',

    // History Screen & Analytics Tabs
    workout_history: 'Historial de Entrenamiento',
    completed_sessions: 'sesión(es) completada(s) registrada(s)',
    progressive_overload: 'Sobrecarga Progresiva',
    workout_logs: 'Registros de Sesiones',
    routines: 'Rutinas',
    no_completed_sessions: 'Sin Sesiones Completadas',
    first_workout_prompt: 'Completa tu primer entrenamiento para visualizar tus registros y progreso aquí.',

    // Progressive Overload & Charts
    routine_progression_overload: 'Sobrecarga Progresiva de Rutina',
    routine_progression_subtitle: 'Rastrea todos los movimientos simultáneamente en la línea temporal compartida',
    relative_growth: 'Crecimiento Relativo (%)',
    estimated_1rm: '1RM Estimado',
    top_set_load: 'Carga Serie Principal',
    total_volume: 'Volumen Total',
    tracked_lifts: 'Ejercicios Registrados',
    timeline_span: 'Línea Temporal',
    top_gainer: 'Mayor Progreso',
    visible: 'visibles',
    sessions: 'sesiones',
    session: 'Sesión',
    select_all: 'Seleccionar Todo',
    deselect_all: 'Deseleccionar Todo',
    select_exercise_placeholder: 'Selecciona un ejercicio...',
    all_routine_workouts: 'Todas las Rutinas',
    baseline_indicator: '100% Base Inicial',
    skipped_session: 'No realizado',
    exercises_legend: 'LEYENDA DE EJERCICIOS',
    legend_tip: '(Toca para alternar · Doble toque para aislar)',
    no_routine_sessions: 'Sin sesiones registradas aún',
    no_routine_sessions_desc: 'Completa entrenamientos en esta rutina para desbloquear el seguimiento de progresión.',
    all_lines_hidden: 'Todas las líneas ocultas',
    all_lines_hidden_desc: 'Selecciona un ejercicio de la leyenda o haz clic en "Seleccionar Todo" para ver el progreso.',
    show_all_lines: 'Mostrar Todas las Líneas',
    session_details: 'Detalles de la Sesión',
    click_graph_hint: 'Toca la gráfica para ver los detalles de la sesión en pantalla completa',
    previous_session: 'Sesión Anterior',
    next_session: 'Siguiente Sesión',

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

export const MUSCLE_TRANSLATIONS: Record<string, string> = {
  quadriceps: 'Cuádriceps',
  quads: 'Cuádriceps',
  glutes: 'Glúteos',
  chest: 'Pecho',
  shoulders: 'Hombros',
  triceps: 'Tríceps',
  biceps: 'Bíceps',
  forearms: 'Antebrazos',
  lats: 'Dorsales',
  'upper back': 'Espalda Alta',
  'lower back': 'Espalda Baja',
  back: 'Espalda',
  hamstrings: 'Isquiotibiales',
  calves: 'Pantorrillas',
  abs: 'Abdominales',
  core: 'Core',
  traps: 'Trapecios',
  'side deltoids': 'Deltoides Laterales',
  'front deltoids': 'Deltoides Frontales',
  'rear deltoids': 'Deltoides Posteriores',
  deltoids: 'Deltoides',
  legs: 'Piernas',
  arms: 'Brazos',
};

export function translateMuscleGroup(muscle: string, language: AppLanguage = 'en'): string {
  if (language !== 'es') return muscle;
  const key = muscle.trim().toLowerCase();
  return MUSCLE_TRANSLATIONS[key] || muscle;
}

export function translateMuscleList(listStr?: string, language: AppLanguage = 'en'): string {
  if (!listStr) return '';
  if (language !== 'es') return listStr;
  return listStr
    .split(',')
    .map((m) => translateMuscleGroup(m.trim(), language))
    .join(', ');
}
