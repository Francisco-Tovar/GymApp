/**
 * Routine Progression Utilities
 * Handles normalization, metric calculations, and multi-series transformations
 * for routine-level exercise overload tracking over time.
 */

export type RoutineMetricMode = 'relativeGrowth' | 'e1rm' | 'topSet' | 'volume';

export interface RoutineExerciseInput {
  exerciseId?: string | number;
  ExerciseId?: string | number;
  exerciseName?: string;
  ExerciseName?: string;
  exerciseType?: 'weight_reps' | 'time_based';
  sets?: Array<{
    weight?: number;
    Weight?: number;
    reps?: number;
    Reps?: number;
    setNumber?: number;
    SetNumber?: number;
    set_number?: number;
    exerciseType?: 'weight_reps' | 'time_based';
    durationSeconds?: number;
    duration_seconds?: number;
    notes?: string | null;
  }>;
  Sets?: Array<{
    weight?: number;
    Weight?: number;
    reps?: number;
    Reps?: number;
    setNumber?: number;
    SetNumber?: number;
    set_number?: number;
    exerciseType?: 'weight_reps' | 'time_based';
    durationSeconds?: number;
    duration_seconds?: number;
    notes?: string | null;
  }>;
}

export interface RoutineSessionRecord {
  date?: string | Date;
  Date?: string | Date;
  exercises?: RoutineExerciseInput[];
  Exercises?: RoutineExerciseInput[];
  workoutId?: number;
  workoutName?: string;
}

export interface NormalizedRoutineSet {
  weight: number;
  reps: number;
  setNumber: number;
  exerciseType: 'weight_reps' | 'time_based';
  durationSeconds: number;
  notes?: string | null;
}

export interface NormalizedRoutineExerciseSession {
  exerciseId: string;
  exerciseName: string;
  exerciseType: 'weight_reps' | 'time_based';
  sets: NormalizedRoutineSet[];
  e1rm: number;
  topSetWeight: number;
  topSetReps: number;
  volume: number;
  breakdown: string;
}

export interface NormalizedRoutineSession {
  sessionId: string;
  date: Date;
  dateFormatted: string;
  dateIso: string;
  exercises: Map<string, NormalizedRoutineExerciseSession>;
}

export interface ExerciseDataPoint {
  sessionIndex: number;
  date: Date;
  dateFormatted: string;
  hasData: boolean;
  value: number | null;
  displayValue: string;
  subValue?: string;
  sets: NormalizedRoutineSet[];
  breakdown: string;
}

export interface ExerciseSeries {
  id: string;
  name: string;
  color: string;
  baselineE1RM: number;
  firstDate?: Date;
  latestDate?: Date;
  totalLoggedSessions: number;
  points: ExerciseDataPoint[];
  latestValue: number | null;
  growthPercent: number | null;
}

export interface ProcessedRoutineChartData {
  sessions: NormalizedRoutineSession[];
  series: ExerciseSeries[];
  metricMode: RoutineMetricMode;
  yAxisLabel: string;
  yMin: number;
  yMax: number;
  unit: string;
}

export const ROUTINE_PALETTE = [
  '#38bdf8', // Sky Blue
  '#34d399', // Emerald Green
  '#fbbf24', // Amber Gold
  '#f43f5e', // Rose Red
  '#a855f7', // Purple
  '#06b6d4', // Cyan
  '#fb923c', // Tangerine Orange
  '#e879f9', // Magenta Pink
  '#4ade80', // Lime Mint
  '#818cf8', // Indigo
  '#eab308', // Warm Yellow
  '#ec4899', // Hot Pink
];

/**
 * Calculates Epley 1RM: Weight * (1 + Reps / 30)
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

/**
 * Finds highest E1RM across a list of sets.
 */
export function calculateSessionE1RM(sets: NormalizedRoutineSet[]): number {
  if (!sets || sets.length === 0) return 0;
  let max = 0;
  for (const s of sets) {
    const val = calculateEpley1RM(s.weight, s.reps);
    if (val > max) max = val;
  }
  return Math.round(max * 10) / 10;
}

/**
 * Identifies top set load (heaviest weight, tie-break by reps).
 */
export function calculateSessionTopSet(sets: NormalizedRoutineSet[]): {
  weight: number;
  reps: number;
  label: string;
} {
  if (!sets || sets.length === 0) {
    return { weight: 0, reps: 0, label: '0 lbs × 0 reps' };
  }

  let top = sets[0];
  for (let i = 1; i < sets.length; i++) {
    const candidate = sets[i];
    if (candidate.weight > top.weight) {
      top = candidate;
    } else if (candidate.weight === top.weight && candidate.reps > top.reps) {
      top = candidate;
    }
  }

  return {
    weight: top.weight,
    reps: top.reps,
    label: `${top.weight} × ${top.reps} reps`,
  };
}

/**
 * Computes total volume: sum of (weight * reps).
 */
export function calculateSessionVolume(sets: NormalizedRoutineSet[]): number {
  if (!sets || sets.length === 0) return 0;
  return sets.reduce((sum, s) => {
    if (s.weight <= 0 || s.reps <= 0) return sum;
    return sum + s.weight * s.reps;
  }, 0);
}

/**
 * Formats sets breakdown string.
 */
export function formatSetsBreakdown(sets: NormalizedRoutineSet[], unit: string = 'lbs'): string {
  if (!sets || sets.length === 0) return 'No completed sets';
  return sets
    .map((s) => {
      if (s.exerciseType === 'time_based' || s.durationSeconds > 0) {
        const mins = Math.floor(s.durationSeconds / 60);
        const secs = s.durationSeconds % 60;
        let timeStr = '';
        if (mins > 0 && secs > 0) timeStr = `${mins}m ${secs}s`;
        else if (mins > 0) timeStr = `${mins} min`;
        else timeStr = `${secs}s`;

        const noteStr = s.notes && s.notes.trim() ? ` (${s.notes.trim()})` : '';
        return `Set ${s.setNumber}: ${timeStr}${noteStr}`;
      }
      const noteStr = s.notes && s.notes.trim() ? ` (${s.notes.trim()})` : '';
      return `Set ${s.setNumber}: ${s.weight} ${unit} × ${s.reps} reps${noteStr}`;
    })
    .join(' | ');
}

/**
 * Normalizes input routine records into clean chronological sessions.
 */
export function normalizeRoutineSessions(records: RoutineSessionRecord[]): NormalizedRoutineSession[] {
  if (!records || records.length === 0) return [];

  const normalized: NormalizedRoutineSession[] = [];

  for (let i = 0; i < records.length; i++) {
    const raw = records[i];
    const rawDate = raw.date ?? raw.Date ?? new Date();
    const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
    const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    const rawExercises = raw.exercises ?? raw.Exercises ?? [];
    const exerciseMap = new Map<string, NormalizedRoutineExerciseSession>();

    for (const ex of rawExercises) {
      const idRaw = ex.exerciseId ?? ex.ExerciseId ?? ex.exerciseName ?? ex.ExerciseName ?? 'unknown';
      const nameRaw = ex.exerciseName ?? ex.ExerciseName ?? `Exercise ${idRaw}`;
      const exerciseKey = String(nameRaw).trim();
      const exerciseId = String(idRaw).trim();

      const rawSets = ex.sets ?? ex.Sets ?? [];
      const isTimeBased =
        ex.exerciseType === 'time_based' ||
        rawSets.some((s) => (s.durationSeconds || s.duration_seconds || 0) > 0 || s.exerciseType === 'time_based');

      const sets: NormalizedRoutineSet[] = rawSets.map((s, sIdx) => {
        const weight = Number(s.weight ?? s.Weight ?? 0);
        const reps = Number(s.reps ?? s.Reps ?? 0);
        const setNumber = Number(s.setNumber ?? s.SetNumber ?? s.set_number ?? sIdx + 1);
        const durationSeconds = Number(s.durationSeconds ?? s.duration_seconds ?? 0);
        const setType = s.exerciseType || (durationSeconds > 0 ? 'time_based' : isTimeBased ? 'time_based' : 'weight_reps');

        return {
          weight: isNaN(weight) || weight < 0 ? 0 : weight,
          reps: isNaN(reps) || reps < 0 ? 0 : Math.floor(reps),
          setNumber,
          exerciseType: setType,
          durationSeconds: isNaN(durationSeconds) || durationSeconds < 0 ? 0 : durationSeconds,
          notes: s.notes || null,
        };
      });

      const e1rm = isTimeBased
        ? Math.round((Math.max(...sets.map((s) => s.durationSeconds), 0) / 60) * 10) / 10
        : calculateSessionE1RM(sets);
      const topSet = calculateSessionTopSet(sets);
      const volume = isTimeBased
        ? Math.round((sets.reduce((sum, s) => sum + s.durationSeconds, 0) / 60) * 10) / 10
        : calculateSessionVolume(sets);

      exerciseMap.set(exerciseKey.toLowerCase(), {
        exerciseId,
        exerciseName: exerciseKey,
        exerciseType: isTimeBased ? 'time_based' : 'weight_reps',
        sets,
        e1rm,
        topSetWeight: isTimeBased ? e1rm : topSet.weight,
        topSetReps: isTimeBased ? 0 : topSet.reps,
        volume,
        breakdown: formatSetsBreakdown(sets),
      });
    }

    normalized.push({
      sessionId: `routine-sess-${validDate.getTime()}-${i}`,
      date: validDate,
      dateFormatted: validDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: validDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      }),
      dateIso: validDate.toISOString(),
      exercises: exerciseMap,
    });
  }

  // Sort chronologically ascending
  normalized.sort((a, b) => a.date.getTime() - b.date.getTime());

  return normalized;
}

/**
 * Discovers all unique exercises across all routine sessions, preserving initial appearance order.
 */
export function discoverRoutineExercises(
  sessions: NormalizedRoutineSession[]
): Array<{ id: string; name: string }> {
  const seen = new Map<string, { id: string; name: string }>();

  for (const s of sessions) {
    for (const [key, item] of s.exercises.entries()) {
      if (!seen.has(key)) {
        seen.set(key, { id: item.exerciseId || item.exerciseName, name: item.exerciseName });
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Returns human-readable Y-Axis title based on metric mode.
 */
export function getRoutineModeLabel(mode: RoutineMetricMode, unit: string = 'lbs'): string {
  switch (mode) {
    case 'relativeGrowth':
      return 'Relative Growth (%)';
    case 'e1rm':
      return `Estimated 1RM (${unit}) / Max Hold (min)`;
    case 'topSet':
      return `Top Set Weight (${unit}) / Duration (min)`;
    case 'volume':
      return `Total Volume (${unit}) / Total Time (min)`;
  }
}

/**
 * Core transformation pipeline for multi-line routine progression.
 */
export function processRoutineProgression(
  records: RoutineSessionRecord[],
  mode: RoutineMetricMode = 'relativeGrowth',
  unit: string = 'lbs'
): ProcessedRoutineChartData {
  const sessions = normalizeRoutineSessions(records);
  const discoveredExercises = discoverRoutineExercises(sessions);

  const seriesList: ExerciseSeries[] = discoveredExercises.map((meta, colorIdx) => {
    const key = meta.name.toLowerCase();
    const color = ROUTINE_PALETTE[colorIdx % ROUTINE_PALETTE.length];

    // Find baseline: first chronological session where exercise was performed with e1rm > 0
    let baselineE1RM = 0;
    let firstDate: Date | undefined;
    let latestDate: Date | undefined;
    let totalLoggedSessions = 0;

    for (const session of sessions) {
      const exData = session.exercises.get(key);
      if (exData && exData.sets.length > 0) {
        totalLoggedSessions++;
        if (!firstDate) firstDate = session.date;
        latestDate = session.date;

        if (baselineE1RM === 0 && exData.e1rm > 0) {
          baselineE1RM = exData.e1rm;
        }
      }
    }

    // Build data points for each session timeline step
    const points: ExerciseDataPoint[] = sessions.map((session, sIdx) => {
      const exData = session.exercises.get(key);
      const dateFormatted = session.dateFormatted;

      if (!exData || exData.sets.length === 0) {
        return {
          sessionIndex: sIdx,
          date: session.date,
          dateFormatted,
          hasData: false,
          value: null,
          displayValue: 'Skipped / No sets',
          sets: [],
          breakdown: 'No sets logged for this session',
        };
      }

      const isTimeBased = exData.exerciseType === 'time_based';
      let value: number = 0;
      let displayValue = '';
      let subValue: string | undefined = undefined;

      const formatMinSec = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        if (m > 0 && s > 0) return `${m}m ${s}s`;
        if (m > 0) return `${m} min`;
        return `${s}s`;
      };

      if (isTimeBased) {
        const durations = exData.sets.map((s) => s.durationSeconds);
        const maxSecs = durations.length > 0 ? Math.max(...durations) : 0;
        const totalSecs = durations.reduce((sum, d) => sum + d, 0);

        switch (mode) {
          case 'relativeGrowth': {
            if (baselineE1RM > 0) {
              value = Math.round((exData.e1rm / baselineE1RM) * 1000) / 10;
            } else {
              value = 100;
            }
            const delta = Math.round((value - 100) * 10) / 10;
            const deltaSign = delta > 0 ? `+${delta}%` : `${delta}%`;
            displayValue = `${value}% (${deltaSign})`;
            subValue = `Max Set: ${formatMinSec(maxSecs)} (Baseline: ${formatMinSec(Math.round(baselineE1RM * 60))})`;
            break;
          }
          case 'e1rm':
          case 'topSet': {
            value = Math.round((maxSecs / 60) * 10) / 10;
            displayValue = formatMinSec(maxSecs);
            subValue = 'Peak Hold / Duration';
            break;
          }
          case 'volume': {
            value = Math.round((totalSecs / 60) * 10) / 10;
            displayValue = formatMinSec(totalSecs);
            subValue = 'Total Duration';
            break;
          }
        }
      } else {
        switch (mode) {
          case 'relativeGrowth': {
            if (baselineE1RM > 0) {
              value = Math.round((exData.e1rm / baselineE1RM) * 1000) / 10;
            } else {
              value = 100;
            }
            const delta = Math.round((value - 100) * 10) / 10;
            const deltaSign = delta > 0 ? `+${delta}%` : `${delta}%`;
            displayValue = `${value}% (${deltaSign})`;
            subValue = `1RM: ${exData.e1rm} ${unit} (Baseline: ${baselineE1RM} ${unit})`;
            break;
          }
          case 'e1rm': {
            value = exData.e1rm;
            displayValue = `${value} ${unit}`;
            subValue = 'Estimated Epley 1RM';
            break;
          }
          case 'topSet': {
            value = exData.topSetWeight;
            displayValue = `${exData.topSetWeight} ${unit} × ${exData.topSetReps} reps`;
            subValue = 'Heaviest Weight';
            break;
          }
          case 'volume': {
            value = exData.volume;
            displayValue = `${value.toLocaleString()} ${unit}`;
            subValue = 'Total Volume (Weight × Reps)';
            break;
          }
        }
      }

      return {
        sessionIndex: sIdx,
        date: session.date,
        dateFormatted,
        hasData: true,
        value,
        displayValue,
        subValue,
        sets: exData.sets,
        breakdown: formatSetsBreakdown(exData.sets, unit),
      };
    });

    // Compute summary metrics for series
    const validPoints = points.filter((p) => p.hasData && p.value !== null);
    const latestPt = validPoints.length > 0 ? validPoints[validPoints.length - 1] : null;
    const latestValue = latestPt ? latestPt.value : null;

    let growthPercent: number | null = null;
    if (baselineE1RM > 0 && validPoints.length > 0) {
      const latestE1RM = sessions[sessions.length - 1]?.exercises.get(key)?.e1rm;
      if (latestE1RM !== undefined && latestE1RM > 0) {
        growthPercent = Math.round(((latestE1RM - baselineE1RM) / baselineE1RM) * 1000) / 10;
      }
    }

    return {
      id: meta.id,
      name: meta.name,
      color,
      baselineE1RM,
      firstDate,
      latestDate,
      totalLoggedSessions,
      points,
      latestValue,
      growthPercent,
    };
  });

  // Calculate global Y bounds across all series
  const allValues: number[] = [];
  for (const s of seriesList) {
    for (const p of s.points) {
      if (p.hasData && p.value !== null) {
        allValues.push(p.value);
      }
    }
  }

  let yMin = 0;
  let yMax = 100;

  if (allValues.length > 0) {
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);

    if (mode === 'relativeGrowth') {
      yMin = Math.min(rawMin * 0.95, 90);
      yMax = Math.max(rawMax * 1.05, 110);
    } else {
      yMin = Math.max(0, Math.floor(rawMin * 0.9));
      yMax = Math.ceil(rawMax * 1.1) || 10;
    }
  }

  return {
    sessions,
    series: seriesList,
    metricMode: mode,
    yAxisLabel: getRoutineModeLabel(mode, unit),
    yMin,
    yMax,
    unit,
  };
}

/**
 * Calculates dynamic Y-axis bounds filtered specifically by visible exercise IDs.
 */
export function calculateVisibleYBounds(
  seriesList: ExerciseSeries[],
  visibleIds: Set<string>,
  mode: RoutineMetricMode
): { yMin: number; yMax: number } {
  const visibleValues: number[] = [];

  for (const s of seriesList) {
    if (!visibleIds.has(s.id)) continue;
    for (const p of s.points) {
      if (p.hasData && p.value !== null) {
        visibleValues.push(p.value);
      }
    }
  }

  if (visibleValues.length === 0) {
    return mode === 'relativeGrowth' ? { yMin: 80, yMax: 120 } : { yMin: 0, yMax: 100 };
  }

  const rawMin = Math.min(...visibleValues);
  const rawMax = Math.max(...visibleValues);

  if (rawMin === rawMax) {
    if (mode === 'relativeGrowth') {
      return { yMin: Math.max(0, rawMin - 15), yMax: rawMax + 15 };
    }
    return { yMin: Math.max(0, rawMin - 10), yMax: rawMax + 10 || 10 };
  }

  if (mode === 'relativeGrowth') {
    const span = rawMax - rawMin;
    const padding = Math.max(5, span * 0.1);
    const yMin = Math.max(0, Math.floor((rawMin - padding) / 5) * 5);
    const yMax = Math.ceil((rawMax + padding) / 5) * 5;
    return { yMin, yMax };
  } else {
    const span = rawMax - rawMin;
    const padding = Math.max(2, span * 0.1);
    const yMin = Math.max(0, Math.floor(rawMin - padding));
    const yMax = Math.ceil(rawMax + padding);
    return { yMin, yMax };
  }
}
