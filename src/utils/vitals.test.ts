import {
  calculateAge,
  cmToFeetInches,
  feetInchesToCm,
  formatHeight,
  calculateBMI,
  getBMICategory,
} from './vitals';

console.log('--- Vitals & BMI Unit Tests ---');

// Test 1: Calculate age from DOB
const dob30YearsAgo = new Date();
dob30YearsAgo.setFullYear(dob30YearsAgo.getFullYear() - 30);
const dobStr = dob30YearsAgo.toISOString().split('T')[0];
const calculatedAge = calculateAge(dobStr);
if (calculatedAge !== 30) {
  throw new Error(`Expected age 30, got ${calculatedAge}`);
}
if (calculateAge(null) !== null) {
  throw new Error('Expected null for null DOB');
}
console.log('✓ Age calculation verified');

// Test 2: Height conversions
const ftIn = cmToFeetInches(180); // 180 cm ~ 5 ft 11 in
if (ftIn.feet !== 5 || ftIn.inches !== 11) {
  throw new Error(`Expected 5ft 11in for 180cm, got ${ftIn.feet}ft ${ftIn.inches}in`);
}
const cmBack = feetInchesToCm(5, 11);
if (Math.abs(cmBack - 180.3) > 0.5) {
  throw new Error(`Expected ~180.3 cm for 5ft 11in, got ${cmBack}`);
}
if (formatHeight(175, 'cm') !== '175 cm') {
  throw new Error('Expected 175 cm formatting');
}
if (formatHeight(180, 'ft_in') !== '5′ 11″') {
  throw new Error('Expected 5′ 11″ formatting');
}
console.log('✓ Height conversions verified');

// Test 3: BMI Calculation
// 80 kg, 180 cm -> BMI = 80 / (1.8^2) = 24.69 -> 24.7
const bmiKg = calculateBMI(80, 'kg', 180);
if (bmiKg !== 24.7) {
  throw new Error(`Expected BMI 24.7, got ${bmiKg}`);
}
// 176.37 lb, 180 cm -> ~24.7
const bmiLb = calculateBMI(176.37, 'lb', 180);
if (Math.abs((bmiLb || 0) - 24.7) > 0.2) {
  throw new Error(`Expected BMI ~24.7 for lb input, got ${bmiLb}`);
}
const catEn = getBMICategory(24.7, 'en');
if (catEn.category !== 'Normal weight') {
  throw new Error(`Expected 'Normal weight', got ${catEn.category}`);
}
const catEs = getBMICategory(24.7, 'es');
if (catEs.category !== 'Normal / Saludable') {
  throw new Error(`Expected 'Normal / Saludable', got ${catEs.category}`);
}
console.log('✓ BMI calculation and categories verified');
console.log('All Vitals unit tests passed successfully!');
