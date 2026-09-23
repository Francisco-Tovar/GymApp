import { WeightUnit } from '../types';

export const LB_TO_KG = 0.45359237;
export const KG_TO_LB = 2.20462262;

/**
 * Converts a weight value between 'kg' and 'lb'.
 * Rounds up/down to the closest round number (nearest integer).
 */
export function convertWeight(weight: number, fromUnit: WeightUnit, toUnit: WeightUnit): number {
  if (fromUnit === toUnit || isNaN(weight) || weight <= 0) {
    return weight;
  }

  let converted: number;
  if (fromUnit === 'lb' && toUnit === 'kg') {
    converted = weight * LB_TO_KG;
  } else {
    converted = weight * KG_TO_LB;
  }

  // Round to closest round number (nearest integer)
  return Math.round(converted);
}

/**
 * Formats a weight with conversion and unit suffix.
 */
export function formatWeight(weight: number, fromUnit: WeightUnit, targetUnit: WeightUnit): string {
  const converted = convertWeight(weight, fromUnit, targetUnit);
  return `${converted} ${targetUnit}`;
}
