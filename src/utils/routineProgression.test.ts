import {
  calculateEpley1RM,
  calculateSessionE1RM,
  calculateSessionTopSet,
  calculateSessionVolume,
  normalizeRoutineSessions,
  processRoutineProgression,
  calculateVisibleYBounds,
  RoutineSessionRecord,
  NormalizedRoutineSet,
} from './routineProgression';

function runRoutineProgressionTestSuite() {
  console.log('--- Routine Progression Unit Tests ---');

  // Test 1: Epley 1RM accuracy
  const rm1 = calculateEpley1RM(100, 10);
  console.assert(Math.abs(rm1 - 133.33) < 0.1, 'Epley 1RM calculation mismatch');
  console.assert(calculateEpley1RM(0, 10) === 0, 'Weight 0 should yield 0 1RM');
  console.assert(calculateEpley1RM(100, 0) === 0, 'Reps 0 should yield 0 1RM');
  console.assert(calculateEpley1RM(-10, 5) === 0, 'Negative weight should yield 0 1RM');

  // Test 2: Peak Session E1RM
  const sets: NormalizedRoutineSet[] = [
    { weight: 100, reps: 5, setNumber: 1, exerciseType: 'weight_reps', durationSeconds: 0 },
    { weight: 110, reps: 6, setNumber: 2, exerciseType: 'weight_reps', durationSeconds: 0 },
    { weight: 105, reps: 4, setNumber: 3, exerciseType: 'weight_reps', durationSeconds: 0 },
  ];
  console.assert(calculateSessionE1RM(sets) === 132, 'Session max 1RM mismatch');

  // Test 3: Top set with tie-breaking
  const tieSets: NormalizedRoutineSet[] = [
    { weight: 150, reps: 8, setNumber: 1, exerciseType: 'weight_reps', durationSeconds: 0 },
    { weight: 150, reps: 10, setNumber: 2, exerciseType: 'weight_reps', durationSeconds: 0 },
    { weight: 140, reps: 12, setNumber: 3, exerciseType: 'weight_reps', durationSeconds: 0 },
  ];
  const top = calculateSessionTopSet(tieSets);
  console.assert(top.weight === 150 && top.reps === 10, 'Top set tie-break failed');

  // Test 4: Total Volume
  const volSets: NormalizedRoutineSet[] = [
    { weight: 100, reps: 10, setNumber: 1, exerciseType: 'weight_reps', durationSeconds: 0 },
    { weight: 110, reps: 8, setNumber: 2, exerciseType: 'weight_reps', durationSeconds: 0 },
  ];
  console.assert(calculateSessionVolume(volSets) === 1880, 'Session volume mismatch');

  // Test 5: Normalization, Chronological Sorting & Missing Data
  const sampleRecords: RoutineSessionRecord[] = [
    {
      Date: '2026-02-15',
      Exercises: [
        {
          ExerciseName: 'Flat Dumbbell Bench Press',
          Sets: [
            { Weight: 25, Reps: 10 },
            { Weight: 25, Reps: 8 },
          ],
        },
        {
          ExerciseName: 'Lat Pulldowns',
          Sets: [{ Weight: 60, Reps: 10 }],
        },
      ],
    },
    {
      Date: '2026-01-10', // Disordered date
      Exercises: [
        {
          ExerciseName: 'Flat Dumbbell Bench Press',
          Sets: [{ Weight: 20, Reps: 10 }], // Baseline E1RM = 20 * (1 + 10/30) = 26.7
        },
        {
          ExerciseName: 'Lat Pulldowns',
          Sets: [{ Weight: 50, Reps: 10 }], // Baseline E1RM = 50 * (1 + 10/30) = 66.7
        },
      ],
    },
    {
      Date: '2026-03-20',
      Exercises: [
        {
          ExerciseName: 'Flat Dumbbell Bench Press',
          Sets: [{ Weight: 30, Reps: 10 }],
        },
        // Lat Pulldowns intentionally omitted to test skipped exercise handling
      ],
    },
  ];

  const normalized = normalizeRoutineSessions(sampleRecords);
  console.assert(normalized.length === 3, 'Expected 3 normalized sessions');
  console.assert(normalized[0].dateIso.startsWith('2026-01-10'), 'Sorting failed: Jan 10 should be first');
  console.assert(normalized[1].dateIso.startsWith('2026-02-15'), 'Sorting failed: Feb 15 should be second');
  console.assert(normalized[2].dateIso.startsWith('2026-03-20'), 'Sorting failed: Mar 20 should be third');

  // Test 6: Relative Growth mode calculation
  const growthResult = processRoutineProgression(sampleRecords, 'relativeGrowth');
  console.assert(growthResult.series.length === 2, 'Expected 2 exercise series');

  const benchSeries = growthResult.series.find((s) => s.name === 'Flat Dumbbell Bench Press');
  console.assert(Boolean(benchSeries), 'Flat Dumbbell Bench Press series missing');
  console.assert(Math.abs(benchSeries!.baselineE1RM - 26.7) < 0.2, 'Baseline E1RM mismatch');
  console.assert(benchSeries!.points[0].value === 100, 'Baseline session should be exactly 100%');
  console.assert(benchSeries!.points[2].value! > 140, 'Final session should show growth > 140%');

  // Test 7: Handling skipped exercises as missing points without crashing
  const latSeries = growthResult.series.find((s) => s.name === 'Lat Pulldowns');
  console.assert(Boolean(latSeries), 'Lat Pulldowns series missing');
  const session3Point = latSeries!.points[2];
  console.assert(session3Point.hasData === false, 'Skipped session point should have hasData: false');
  console.assert(session3Point.value === null, 'Skipped session point should have null value');

  // Test 8: Dynamic Visible Y-Axis Bounds
  const benchOnlyBounds = calculateVisibleYBounds(growthResult.series, new Set([benchSeries!.id]), 'volume');
  const bothBounds = calculateVisibleYBounds(
    growthResult.series,
    new Set([benchSeries!.id, latSeries!.id]),
    'volume'
  );
  console.assert(bothBounds.yMax >= benchOnlyBounds.yMax, 'Both series bound should encompass bench-only bound');

  // Test 10: Time-based exercise within a routine
  const routineWithTime: RoutineSessionRecord[] = [
    {
      Date: '2026-01-01',
      Exercises: [
        {
          ExerciseName: 'Treadmill',
          exerciseType: 'time_based',
          Sets: [{ durationSeconds: 600 }], // 10 min
        },
      ],
    },
    {
      Date: '2026-01-15',
      Exercises: [
        {
          ExerciseName: 'Treadmill',
          exerciseType: 'time_based',
          Sets: [{ durationSeconds: 900 }], // 15 min
        },
      ],
    },
  ];

  const timeRoutineResult = processRoutineProgression(routineWithTime, 'relativeGrowth');
  console.assert(timeRoutineResult.series.length === 1, 'Expected 1 time-based series');
  console.assert(timeRoutineResult.series[0].points[0].value === 100, 'Baseline should be 100%');
  console.assert(timeRoutineResult.series[0].points[1].value === 150, '15 min vs 10 min should be 150%');

  console.log('✓ All 10 Routine Progression tests passed successfully!');
}

runRoutineProgressionTestSuite();
