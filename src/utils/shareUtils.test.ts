import { formatWorkoutDuration, generateWorkoutShareText } from './shareUtils';
import { SessionSet } from '../types';

console.log('--- Share Utils Unit Tests ---');

// Test 1: Duration formatting
const dur1 = formatWorkoutDuration(45, 'en');
if (dur1 !== '45s') throw new Error(`Expected 45s, got ${dur1}`);

const dur1Es = formatWorkoutDuration(45, 'es');
if (dur1Es !== '45 s') throw new Error(`Expected 45 s, got ${dur1Es}`);

const dur2 = formatWorkoutDuration(150, 'en'); // 2m 30s
if (dur2 !== '2m 30s') throw new Error(`Expected 2m 30s, got ${dur2}`);

const dur2Es = formatWorkoutDuration(150, 'es');
if (dur2Es !== '2 min 30 s') throw new Error(`Expected 2 min 30 s, got ${dur2Es}`);

const dur3 = formatWorkoutDuration(3665, 'en'); // 1h 1m 5s -> 1h 1m
if (dur3 !== '1h 1m') throw new Error(`Expected 1h 1m, got ${dur3}`);

const dur3Es = formatWorkoutDuration(3665, 'es');
if (dur3Es !== '1 h 1 min') throw new Error(`Expected 1 h 1 min, got ${dur3Es}`);

console.log('✓ Duration formatting tests passed');

// Test 2: Message generation with duration
const mockSets: SessionSet[] = [
  {
    exercise_id: 1,
    exercise_name: 'Bench Press',
    set_number: 1,
    weight: 185,
    reps: 8,
    unit: 'lb',
    exercise_type: 'weight_reps',
  },
  {
    exercise_id: 1,
    exercise_name: 'Bench Press',
    set_number: 2,
    weight: 185,
    reps: 8,
    unit: 'lb',
    exercise_type: 'weight_reps',
  },
];

const textEn = generateWorkoutShareText(
  {
    workout_name: 'Upper Body Blast',
    date: '2026-10-09T18:00:00.000Z',
    durationSeconds: 2700, // 45m
  },
  mockSets,
  'lb',
  'en'
);

if (!textEn.includes('⏱️ *Duration:* 45m')) {
  throw new Error(`Expected duration in header, got:\n${textEn}`);
}
if (!textEn.includes('• Total Duration: 45m')) {
  throw new Error(`Expected total duration in summary, got:\n${textEn}`);
}

const textEs = generateWorkoutShareText(
  {
    workout_name: 'Pecho y Tríceps',
    date: '2026-10-09T18:00:00.000Z',
    durationSeconds: 2700,
  },
  mockSets,
  'lb',
  'es'
);

if (!textEs.includes('⏱️ *Duración:* 45 min')) {
  throw new Error(`Expected duration in Spanish header, got:\n${textEs}`);
}
if (!textEs.includes('• Tiempo Total: 45 min')) {
  throw new Error(`Expected total duration in Spanish summary, got:\n${textEs}`);
}

console.log('✓ Share text generation tests passed');
console.log('All Share Utils tests passed successfully!');
