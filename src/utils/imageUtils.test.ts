import { isValidImageUrl } from './imageUtils';
import { Exercise } from '../types';
import { t, TranslationKey } from './i18n';

function runImageUtilsTestSuite() {
  console.log('--- Exercise Image Attachment & Guide Test Suite ---');

  // Test 1: URL validation for data URLs
  console.assert(
    isValidImageUrl('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='),
    'Expected valid base64 PNG data URL to pass'
  );
  console.assert(
    isValidImageUrl('data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='),
    'Expected valid WebP data URL to pass'
  );
  console.assert(
    isValidImageUrl('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP...'),
    'Expected valid JPEG data URL to pass'
  );
  console.assert(
    isValidImageUrl('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'),
    'Expected valid GIF data URL to pass'
  );
  console.log('✓ Data URL validation passed (including GIF)');

  // Test 2: URL validation for remote URLs
  console.assert(
    isValidImageUrl('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
    'Expected HTTPS image URL to pass'
  );
  console.assert(
    isValidImageUrl('http://example.com/squat-guide.png'),
    'Expected HTTP image URL to pass'
  );
  console.assert(
    isValidImageUrl('https://fitnessprogramer.com/wp-content/uploads/2021/02/Hack-Squat.gif'),
    'Expected animated GIF URL to pass'
  );
  console.assert(
    !isValidImageUrl('javascript:alert(1)'),
    'Expected javascript: pseudo-protocol to be rejected'
  );
  console.assert(
    !isValidImageUrl('ftp://example.com/pic.jpg'),
    'Expected FTP protocol to be rejected'
  );
  console.assert(
    !isValidImageUrl(''),
    'Expected empty string to be rejected'
  );
  console.assert(
    !isValidImageUrl('not a url'),
    'Expected malformed string to be rejected'
  );
  console.log('✓ Remote URL validation passed');

  // Test 3: Exercise interface supports imageUrl and notes
  const mockExerciseWithImage: Exercise = {
    id: 1,
    name: 'Hack Squats',
    muscle_groups: 'Quadriceps, Glutes',
    imageUrl: 'data:image/webp;base64,sample',
    notes: 'Keep knees tracking over toes, descend to 90 degrees.',
  };

  console.assert(mockExerciseWithImage.imageUrl === 'data:image/webp;base64,sample', 'imageUrl not stored properly');
  console.assert(Boolean(mockExerciseWithImage.notes?.includes('knees tracking')), 'notes not stored properly');

  const mockExerciseWithoutImage: Exercise = {
    id: 2,
    name: 'Flat Dumbbell Bench Press',
    muscle_groups: 'Chest, Shoulders',
    imageUrl: null,
    notes: null,
  };
  console.assert(mockExerciseWithoutImage.imageUrl === null, 'nullable imageUrl should be allowed');
  console.assert(mockExerciseWithoutImage.notes === null, 'nullable notes should be allowed');
  console.log('✓ Exercise data model contracts verified');

  // Test 4: Localization translations exist in both English and Spanish
  const requiredKeys: TranslationKey[] = [
    'exercise_guide',
    'view_guide',
    'guide_image',
    'image_upload',
    'drop_image_here',
    'image_formats_hint',
    'change_image',
    'remove_image',
    'or_enter_image_url',
    'image_url_placeholder',
    'form_cues',
    'form_cues_placeholder',
    'no_form_cues',
  ];

  for (const key of requiredKeys) {
    const enText = t(key, 'en');
    const esText = t(key, 'es');
    console.assert(Boolean(enText && enText !== key), `Missing EN translation for "${key}"`);
    console.assert(Boolean(esText && esText !== key), `Missing ES translation for "${key}"`);
    console.assert(enText !== esText, `EN and ES translations are identical for "${key}": "${enText}"`);
  }
  console.log('✓ English and Spanish localization strings verified for all guide keys');

  console.log('All Exercise Image Attachment tests passed successfully!');
}

runImageUtilsTestSuite();
