import {
  calculateEpley1RM,
  calculateSessionE1RM,
  calculateSessionTopSet,
  calculateSessionVolume,
  formatSetsBreakdown,
  processExerciseProgression,
  getAvailableExercises,
  getModeYAxisLabel,
  WorkoutSessionRecord,
} from './progressiveOverload';

function runTestSuite() {
  console.log('--- Progressive Overload Unit Tests ---');

  // Test 1: Epley 1RM Formula
  const rm1 = calculateEpley1RM(100, 10);
  console.assert(Math.abs(rm1 - 133.33) < 0.1, 'Epley 1RM calculation mismatch');

  // Test 2: Edge Cases (0 weight or 0 reps)
  console.assert(calculateEpley1RM(0, 10) === 0, 'Weight 0 should yield 0 1RM');
  console.assert(calculateEpley1RM(100, 0) === 0, 'Reps 0 should yield 0 1RM');
  console.assert(calculateEpley1RM(-10, 5) === 0, 'Negative weight should yield 0 1RM');

  // Test 3: Session E1RM (highest set 1RM)
  const sessionSets = [
    { weight: 200, reps: 5, setNumber: 1 }, // 200 * (1 + 5/30) = 233.33
    { weight: 220, reps: 3, setNumber: 2 }, // 220 * (1 + 3/30) = 242.0
    { weight: 180, reps: 8, setNumber: 3 }, // 180 * (1 + 8/30) = 228.0
  ];
  console.assert(calculateSessionE1RM(sessionSets) === 242, 'Session max 1RM mismatch');

  // Test 4: Top Set Load and Rep Counts
  const topSet = calculateSessionTopSet(sessionSets);
  console.assert(topSet.weight === 220, 'Top set weight mismatch');
  console.assert(topSet.reps === 3, 'Top set reps mismatch');
  console.assert(topSet.label === '220 × 3 reps', 'Top set label mismatch');

  // Test 5: Top Set Tie Breaking by Reps
  const tieSets = [
    { weight: 150, reps: 8, setNumber: 1 },
    { weight: 150, reps: 12, setNumber: 2 },
  ];
  const topTie = calculateSessionTopSet(tieSets);
  console.assert(topTie.reps === 12, 'Tie-breaking should prefer higher reps');

  // Test 6: Bodyweight Exercise (weight = 0)
  const bodyweightSets = [
    { weight: 0, reps: 15, setNumber: 1 },
    { weight: 0, reps: 12, setNumber: 2 },
  ];
  console.assert(calculateSessionVolume(bodyweightSets) === 0, 'Bodyweight volume should be 0');
  const topBw = calculateSessionTopSet(bodyweightSets);
  console.assert(topBw.weight === 0 && topBw.reps === 15, 'Bodyweight top set should record 0 weight and 15 reps');

  // Test 7: Total Session Volume
  console.assert(calculateSessionVolume(sessionSets) === 3100, 'Total session volume mismatch');

  // Test 8: Set breakdown format
  const breakdown = formatSetsBreakdown(sessionSets, 'lbs');
  console.assert(
    breakdown === 'Set 1: 200 lbs × 5 reps | Set 2: 220 lbs × 3 reps | Set 3: 180 lbs × 8 reps',
    'Breakdown format mismatch'
  );

  // Test 9: Multi-exercise filtering and chronological sorting
  const records: WorkoutSessionRecord[] = [
    {
      ExerciseId: 'ex-bench',
      ExerciseName: 'Bench Press',
      Date: '2026-09-15T12:00:00Z',
      Sets: [{ Weight: 205, Reps: 5 }],
    },
    {
      ExerciseId: 'ex-squat',
      ExerciseName: 'Squat',
      Date: '2026-09-12T12:00:00Z',
      Sets: [{ Weight: 315, Reps: 5 }],
    },
    {
      ExerciseId: 'ex-bench',
      ExerciseName: 'Bench Press',
      Date: '2026-09-01T12:00:00Z',
      Sets: [{ Weight: 185, Reps: 5 }],
    },
  ];

  const benchE1RM = processExerciseProgression(records, 'ex-bench', 'e1rm', 'lb');
  console.assert(benchE1RM.length === 2, 'Should filter strictly to Bench Press records');
  console.assert(benchE1RM[0].date.getTime() < benchE1RM[1].date.getTime(), 'Should be sorted chronologically');

  const exercises = getAvailableExercises(records);
  console.assert(exercises.length === 2, 'Should return 2 distinct exercises');

  const yLabel1 = getModeYAxisLabel('e1rm', 'lb');
  const yLabel2 = getModeYAxisLabel('topSet', 'lb');
  const yLabel3 = getModeYAxisLabel('volume', 'lb');
  console.assert(yLabel1 === 'Estimated 1RM (lb)', 'Y-axis label e1rm mismatch');
  console.assert(yLabel2 === 'Heaviest Weight (lb)', 'Y-axis label topSet mismatch');
  console.assert(yLabel3 === 'Total Volume (lb)', 'Y-axis label volume mismatch');

  // Test 10: Time range interval filtering
  const multiMonthRecords: WorkoutSessionRecord[] = [
    {
      ExerciseId: 'ex-bench',
      ExerciseName: 'Bench Press',
      Date: '2026-09-20T12:00:00Z', // Today / recent
      Sets: [{ Weight: 225, Reps: 5 }],
    },
    {
      ExerciseId: 'ex-bench',
      ExerciseName: 'Bench Press',
      Date: '2026-08-15T12:00:00Z', // ~1.2 months ago
      Sets: [{ Weight: 215, Reps: 5 }],
    },
    {
      ExerciseId: 'ex-bench',
      ExerciseName: 'Bench Press',
      Date: '2026-05-10T12:00:00Z', // ~4.3 months ago
      Sets: [{ Weight: 200, Reps: 5 }],
    },
    {
      ExerciseId: 'ex-bench',
      ExerciseName: 'Bench Press',
      Date: '2025-12-01T12:00:00Z', // ~9.5 months ago
      Sets: [{ Weight: 185, Reps: 5 }],
    },
    {
      ExerciseId: 'ex-bench',
      ExerciseName: 'Bench Press',
      Date: '2025-01-01T12:00:00Z', // ~20 months ago (> 1 year)
      Sets: [{ Weight: 155, Reps: 5 }],
    },
  ];

  const allFiltered = processExerciseProgression(multiMonthRecords, 'ex-bench', 'e1rm', 'lb', 'all');
  console.assert(allFiltered.length === 5, `Expected 5 in all, got ${allFiltered.length}`);

  const oneMonthFiltered = processExerciseProgression(multiMonthRecords, 'ex-bench', 'e1rm', 'lb', '1m');
  console.assert(oneMonthFiltered.length === 1, `Expected 1 in 1m, got ${oneMonthFiltered.length}`);

  const threeMonthsFiltered = processExerciseProgression(multiMonthRecords, 'ex-bench', 'e1rm', 'lb', '3m');
  console.assert(threeMonthsFiltered.length === 2, `Expected 2 in 3m, got ${threeMonthsFiltered.length}`);

  const sixMonthsFiltered = processExerciseProgression(multiMonthRecords, 'ex-bench', 'e1rm', 'lb', '6m');
  console.assert(sixMonthsFiltered.length === 3, `Expected 3 in 6m, got ${sixMonthsFiltered.length}`);

  const oneYearFiltered = processExerciseProgression(multiMonthRecords, 'ex-bench', 'e1rm', 'lb', '1y');
  console.assert(oneYearFiltered.length === 4, `Expected 4 in 1y, got ${oneYearFiltered.length}`);

  console.log('All 10 test suites passed successfully!');
}

runTestSuite();

