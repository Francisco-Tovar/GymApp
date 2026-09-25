export interface WorkoutSetRecord {
  weight?: number;
  Weight?: number;
  reps?: number;
  Reps?: number;
  unit?: string;
  Unit?: string;
  setNumber?: number;
  SetNumber?: number;
  set_number?: number;
  exerciseType?: 'weight_reps' | 'time_based';
  durationSeconds?: number;
  duration_seconds?: number;
  notes?: string | null;
}

export interface WorkoutSessionRecord {
  exerciseId?: string | number;
  ExerciseId?: string | number;
  exercise_id?: string | number;
  exerciseName?: string;
  ExerciseName?: string;
  exercise_name?: string;
  exerciseType?: 'weight_reps' | 'time_based';
  date?: string | Date | number;
  Date?: string | Date | number;
  sets?: WorkoutSetRecord[];
  Sets?: WorkoutSetRecord[];
}

export type ProgressionMode = 'e1rm' | 'topSet' | 'volume';

export type TimeRangeInterval = 'all' | '1m' | '3m' | '6m' | '1y';

export interface TimeRangeOption {
  key: TimeRangeInterval;
  label: string;
  shortLabel: string;
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { key: 'all', label: 'All', shortLabel: 'All' },
  { key: '1m', label: 'Last Month', shortLabel: '1M' },
  { key: '3m', label: 'Last 3 Months', shortLabel: '3M' },
  { key: '6m', label: 'Last 6 Months', shortLabel: '6M' },
  { key: '1y', label: 'Last 12 Months (1 Year)', shortLabel: '1Y' },
];

export interface NormalizedSet {
  weight: number;
  reps: number;
  setNumber: number;
  exerciseType: 'weight_reps' | 'time_based';
  durationSeconds: number;
  notes?: string | null;
}

export interface NormalizedSessionRecord {
  exerciseId: string;
  exerciseName: string;
  exerciseType: 'weight_reps' | 'time_based';
  date: Date;
  sets: NormalizedSet[];
}

export interface ProcessedDataPoint {
  id: string;
  date: Date;
  dateFormatted: string;
  dateIso: string;
  value: number;
  displayValue: string;
  subValue?: string;
  topSetReps?: number;
  topSetWeight?: number;
  allSetsSummary: string;
  sets: NormalizedSet[];
}

export interface ExerciseOption {
  id: string;
  name: string;
  sessionCount: number;
  exerciseType?: 'weight_reps' | 'time_based';
}

/**
 * Normalizes any variation of session record properties (camelCase, PascalCase, snake_case).
 */
export function normalizeSessionRecord(record: WorkoutSessionRecord): NormalizedSessionRecord {
  const rawId = record.exerciseId ?? record.ExerciseId ?? record.exercise_id ?? '';
  const rawName = record.exerciseName ?? record.ExerciseName ?? record.exercise_name ?? '';
  const rawDate = record.date ?? record.Date ?? new Date();

  const parsedDate = rawDate instanceof Date ? rawDate : new Date(rawDate);
  const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

  const rawSets = record.sets ?? record.Sets ?? [];
  const sessionExerciseType: 'weight_reps' | 'time_based' =
    record.exerciseType ||
    (rawSets.some((s) => (s.durationSeconds || s.duration_seconds || 0) > 0 || s.exerciseType === 'time_based')
      ? 'time_based'
      : 'weight_reps');

  const normalizedSets: NormalizedSet[] = rawSets.map((s, index) => {
    const weight = Number(s.weight ?? s.Weight ?? 0);
    const reps = Number(s.reps ?? s.Reps ?? 0);
    const setNumber = Number(s.setNumber ?? s.SetNumber ?? s.set_number ?? index + 1);
    const durationSeconds = Number(s.durationSeconds ?? s.duration_seconds ?? 0);
    const setExType = s.exerciseType || (durationSeconds > 0 ? 'time_based' : sessionExerciseType);

    return {
      weight: isNaN(weight) || weight < 0 ? 0 : weight,
      reps: isNaN(reps) || reps < 0 ? 0 : Math.floor(reps),
      setNumber,
      exerciseType: setExType,
      durationSeconds: isNaN(durationSeconds) || durationSeconds < 0 ? 0 : durationSeconds,
      notes: s.notes || null,
    };
  });

  return {
    exerciseId: String(rawId || rawName || 'unknown'),
    exerciseName: String(rawName || `Exercise ${rawId}`),
    exerciseType: sessionExerciseType,
    date: validDate,
    sets: normalizedSets,
  };
}

/**
 * Mode 1: Epley 1RM calculation: Weight * (1 + Reps / 30)
 * Handles edge cases: Reps <= 0 or Weight <= 0 returns 0.
 */
export function calculateEpley1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  return weight * (1 + reps / 30);
}

/**
 * Calculates the highest estimated 1RM among all completed sets in a session.
 */
export function calculateSessionE1RM(sets: NormalizedSet[]): number {
  if (!sets || sets.length === 0) return 0;

  let maxE1RM = 0;
  for (const setItem of sets) {
    const e1rm = calculateEpley1RM(setItem.weight, setItem.reps);
    if (e1rm > maxE1RM) {
      maxE1RM = e1rm;
    }
  }

  return Math.round(maxE1RM * 10) / 10;
}

/**
 * Mode 2: Top Set Load
 * Identifies the set with the heaviest weight lifted.
 * Ties are broken by highest reps, then earliest set number.
 */
export function calculateSessionTopSet(sets: NormalizedSet[]): {
  weight: number;
  reps: number;
  label: string;
} {
  if (!sets || sets.length === 0) {
    return { weight: 0, reps: 0, label: '0 × 0 reps' };
  }

  let topSet: NormalizedSet = sets[0];

  for (let i = 1; i < sets.length; i++) {
    const candidate = sets[i];
    if (candidate.weight > topSet.weight) {
      topSet = candidate;
    } else if (candidate.weight === topSet.weight && candidate.reps > topSet.reps) {
      topSet = candidate;
    }
  }

  return {
    weight: topSet.weight,
    reps: topSet.reps,
    label: `${topSet.weight} × ${topSet.reps} reps`,
  };
}

/**
 * Mode 3: Total Session Volume
 * Formula: Sum of (Weight * Reps) across all logged sets for that exercise in the session.
 */
export function calculateSessionVolume(sets: NormalizedSet[]): number {
  if (!sets || sets.length === 0) return 0;

  return sets.reduce((sum, s) => {
    if (s.weight <= 0 || s.reps <= 0) return sum;
    return sum + s.weight * s.reps;
  }, 0);
}

/**
 * Generates a formatted summary string of all sets in a session.
 * e.g. "Set 1: 25 lbs × 13 reps" or "Set 1: 20 min (20kg vest)"
 */
export function formatSetsBreakdown(sets: NormalizedSet[], unit: string = 'lbs'): string {
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
 * Returns distinct exercise options found in the records.
 */
export function getAvailableExercises(records: WorkoutSessionRecord[]): ExerciseOption[] {
  const map = new Map<string, { id: string; name: string; count: number; exerciseType?: 'weight_reps' | 'time_based' }>();

  for (const raw of records) {
    const item = normalizeSessionRecord(raw);
    const key = item.exerciseId || item.exerciseName;
    if (!key) continue;

    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (item.exerciseType === 'time_based') existing.exerciseType = 'time_based';
    } else {
      map.set(key, {
        id: item.exerciseId,
        name: item.exerciseName,
        count: 1,
        exerciseType: item.exerciseType,
      });
    }
  }

  return Array.from(map.values())
    .map((v) => ({ id: v.id, name: v.name, sessionCount: v.count, exerciseType: v.exerciseType }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns user-friendly Y-Axis label for each analytical mode.
 */
export function getModeYAxisLabel(
  mode: ProgressionMode,
  unit: string = 'lbs',
  exerciseType: 'weight_reps' | 'time_based' = 'weight_reps'
): string {
  if (exerciseType === 'time_based') {
    switch (mode) {
      case 'e1rm':
        return 'Max Single Hold / Duration (min)';
      case 'topSet':
        return 'Peak Set Duration (min)';
      case 'volume':
        return 'Total Time Logged (min)';
    }
  }

  switch (mode) {
    case 'e1rm':
      return `Estimated 1RM (${unit})`;
    case 'topSet':
      return `Heaviest Weight (${unit})`;
    case 'volume':
      return `Total Volume (${unit})`;
  }
}

/**
 * Filters normalized session records based on the selected time interval.
 * Uses the latest session date in the dataset (or current date, whichever is later)
 * as the anchor so historical workouts are evaluated consistently.
 */
export function filterRecordsByTimeRange(
  records: NormalizedSessionRecord[],
  range: TimeRangeInterval,
  referenceDate: Date = new Date()
): NormalizedSessionRecord[] {
  if (range === 'all' || records.length === 0) return records;

  let anchorTime = referenceDate.getTime();
  const latestRecordTime = Math.max(...records.map((r) => r.date.getTime()));
  if (latestRecordTime > anchorTime) {
    anchorTime = latestRecordTime;
  }

  const cutoff = new Date(anchorTime);

  switch (range) {
    case '1m':
      cutoff.setMonth(cutoff.getMonth() - 1);
      break;
    case '3m':
      cutoff.setMonth(cutoff.getMonth() - 3);
      break;
    case '6m':
      cutoff.setMonth(cutoff.getMonth() - 6);
      break;
    case '1y':
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      break;
  }

  const cutoffTime = cutoff.getTime();
  return records.filter((r) => r.date.getTime() >= cutoffTime);
}

/**
 * Main data transformation pipeline for the progressive overload chart.
 * Filters by exercise, filters by time range interval, sorts chronologically, and computes mode values.
 */
export function processExerciseProgression(
  records: WorkoutSessionRecord[],
  exerciseTarget: string,
  mode: ProgressionMode,
  unit: string = 'lbs',
  timeRange: TimeRangeInterval = 'all'
): ProcessedDataPoint[] {
  if (!records || records.length === 0 || !exerciseTarget) {
    return [];
  }

  // 1. Normalize and filter by target exercise
  const targetLower = exerciseTarget.trim().toLowerCase();
  let matching = records
    .map(normalizeSessionRecord)
    .filter(
      (r) =>
        r.exerciseId.toLowerCase() === targetLower ||
        r.exerciseName.toLowerCase() === targetLower
    );

  // 2. Filter by time range interval
  matching = filterRecordsByTimeRange(matching, timeRange);

  // 3. Sort chronologically by date
  matching.sort((a, b) => a.date.getTime() - b.date.getTime());

  // 4. Transform to ProcessedDataPoint for active mode
  return matching.map((session, index) => {
    const isTimeBased = session.exerciseType === 'time_based';
    const dateFormatted = session.date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: session.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });

    const allSetsSummary = formatSetsBreakdown(session.sets, unit);
    let value = 0;
    let displayValue = '';
    let subValue: string | undefined = undefined;

    const topSet = calculateSessionTopSet(session.sets);

    if (isTimeBased) {
      // Time-based calculations in minutes (or seconds if < 1 min)
      const durations = session.sets.map((s) => s.durationSeconds || 0);
      const maxDurationSecs = durations.length > 0 ? Math.max(...durations) : 0;
      const totalDurationSecs = durations.reduce((sum, d) => sum + d, 0);

      const formatMinSec = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        if (m > 0 && s > 0) return `${m}m ${s}s`;
        if (m > 0) return `${m} min`;
        return `${s}s`;
      };

      switch (mode) {
        case 'e1rm':
        case 'topSet': {
          value = Math.round((maxDurationSecs / 60) * 10) / 10;
          displayValue = formatMinSec(maxDurationSecs);
          subValue = mode === 'e1rm' ? 'Longest Set Duration' : 'Top Set Duration';
          break;
        }
        case 'volume': {
          value = Math.round((totalDurationSecs / 60) * 10) / 10;
          displayValue = formatMinSec(totalDurationSecs);
          subValue = 'Total Session Duration';
          break;
        }
      }
    } else {
      switch (mode) {
        case 'e1rm': {
          value = calculateSessionE1RM(session.sets);
          displayValue = `${value.toLocaleString()} ${unit}`;
          subValue = `Epley 1RM`;
          break;
        }
        case 'topSet': {
          value = topSet.weight;
          displayValue = `${topSet.weight} ${unit} × ${topSet.reps} reps`;
          subValue = `Top Set Load`;
          break;
        }
        case 'volume': {
          value = calculateSessionVolume(session.sets);
          displayValue = `${value.toLocaleString()} ${unit}`;
          subValue = `Total Session Volume`;
          break;
        }
      }
    }

    return {
      id: `${session.exerciseId}-${session.date.getTime()}-${index}`,
      date: session.date,
      dateFormatted,
      dateIso: session.date.toISOString(),
      value,
      displayValue,
      subValue,
      topSetReps: topSet.reps,
      topSetWeight: topSet.weight,
      allSetsSummary,
      sets: session.sets,
    };
  });
}
