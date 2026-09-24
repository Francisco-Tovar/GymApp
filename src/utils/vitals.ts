import { AppLanguage, HeightUnit, WeightUnit } from '../types';
import { convertWeight } from './unitConversion';

/**
 * Calculates exact age in years from a date of birth (YYYY-MM-DD).
 */
export function calculateAge(dob?: string | null): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
}

/**
 * Converts centimeters to feet and whole/decimal inches.
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  if (inches === 12) {
    return { feet: feet + 1, inches: 0 };
  }
  return { feet, inches };
}

/**
 * Converts feet and inches to centimeters.
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = (feet * 12) + inches;
  return Math.round(totalInches * 2.54 * 10) / 10;
}

/**
 * Formats height for display based on preference unit.
 */
export function formatHeight(heightCm?: number | null, unit: HeightUnit = 'cm'): string {
  if (!heightCm || heightCm <= 0) return '--';
  if (unit === 'ft_in') {
    const { feet, inches } = cmToFeetInches(heightCm);
    return `${feet}′ ${inches}″`;
  }
  return `${Math.round(heightCm)} cm`;
}

/**
 * Calculates Body Mass Index (BMI = kg / (m^2)).
 */
export function calculateBMI(
  weightValue: number,
  weightUnit: WeightUnit,
  heightCm?: number | null
): number | null {
  if (!heightCm || heightCm <= 0 || !weightValue || weightValue <= 0) return null;
  const weightKg = weightUnit === 'kg' ? weightValue : convertWeight(weightValue, 'lb', 'kg');
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

export interface BMICategoryInfo {
  category: string;
  color: string;
}

/**
 * Returns descriptive category and theme color for a BMI value.
 */
export function getBMICategory(bmi: number | null, language: AppLanguage = 'en'): BMICategoryInfo {
  if (bmi === null || isNaN(bmi)) {
    return { category: '--', color: 'var(--text-secondary)' };
  }

  if (bmi < 18.5) {
    return {
      category: language === 'es' ? 'Bajo peso' : 'Underweight',
      color: '#38bdf8', // light blue
    };
  } else if (bmi < 25) {
    return {
      category: language === 'es' ? 'Normal / Saludable' : 'Normal weight',
      color: '#22c55e', // green
    };
  } else if (bmi < 30) {
    return {
      category: language === 'es' ? 'Sobrepeso / Muscular' : 'Overweight',
      color: '#f59e0b', // amber
    };
  } else {
    return {
      category: language === 'es' ? 'Obesidad' : 'Obese',
      color: '#ef4444', // red
    };
  }
}
