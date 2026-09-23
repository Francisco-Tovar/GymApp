import { normalizeSessionRecord, processExerciseProgression } from './progressiveOverload';
import { normalizeRoutineSessions } from './routineProgression';
import { INITIAL_WORKOUTS } from '../db/db';

function runIdTrackingTestSuite() {
  console.log('--- ID Tracking & Progressive Overload Continuity Tests ---');

  // Test 1: Workout A contains Leg Press canonically
  console.assert(
    INITIAL_WORKOUTS[0].exerciseNames.includes('Leg Press'),
    'Workout A must contain Leg Press canonically'
  );
  console.assert(
    !INITIAL_WORKOUTS[0].exerciseNames.includes('Hack Squats'),
    'Workout A should not have Hack Squats replacing Leg Press'
  );
  console.log('✓ Workout A canonical exercises verified with Leg Press');

  // Test 2: Renaming an exercise preserves overload tracking via exerciseId
  const initialRecords = [
    {
      exerciseId: '10',
      exerciseName: 'Leg Press',
      date: '2025-10-15',
      sets: [{ weight: 140, reps: 15 }],
    },
    {
      exerciseId: '10',
      exerciseName: 'Leg Press',
      date: '2025-11-20',
      sets: [{ weight: 160, reps: 15 }],
    },
    {
      // Renamed to 'Hack Squats' by user, but exerciseId remains '10'
      exerciseId: '10',
      exerciseName: 'Hack Squats',
      date: '2026-01-10',
      sets: [{ weight: 200, reps: 12 }],
    },
  ];

  // Lookup by ID '10' matches all 3 data points regardless of name change
  const processedById = processExerciseProgression(initialRecords, '10', 'topSet', 'lb', 'all');
  console.assert(processedById.length === 3, `Expected 3 points by ID, got ${processedById.length}`);
  console.assert(processedById[0].value === 140, 'First session weight mismatch');
  console.assert(processedById[2].value === 200, 'Renamed session weight mismatch');
  console.log('✓ Exercise progression tracked by exerciseId across name changes');

  // Test 3: Routine normalization preserves exercise ID
  const routineData = [
    {
      workoutId: 1,
      workoutName: 'Full Body A',
      date: '2026-03-01',
      exercises: [
        {
          exerciseId: '10',
          exerciseName: 'Leg Press',
          sets: [{ weight: 270, reps: 18 }],
        },
      ],
    },
  ];

  const normalized = normalizeRoutineSessions(routineData);
  console.assert(normalized.length === 1, 'Normalized length mismatch');
  console.assert(
    normalized[0].exercises.get('leg press')?.exerciseId === '10',
    'Exercise ID lost in routine normalization'
  );
  console.log('✓ Routine normalization retains exerciseId');

  console.log('✓ All ID Tracking tests passed successfully!');
}

runIdTrackingTestSuite();
