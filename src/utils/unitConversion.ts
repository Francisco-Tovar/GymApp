import { WeightUnit } from '../types';

export const KG_TO_LB = 2.20462;
export const LB_TO_KG = 0.453592;

export const convertWeight = (
  weight: number,
  fromUnit: WeightUnit,
  toUnit: WeightUnit
): number => {
  if (fromUnit === toUnit) return weight;
  if (fromUnit === 'kg' && toUnit === 'lb') {
    return Math.round(weight * KG_TO_LB * 10) / 10;
  }
  if (fromUnit === 'lb' && toUnit === 'kg') {
    return Math.round(weight * LB_TO_KG * 10) / 10;
  }
  return weight;
};

export const formatWeight = (weight: number, unit: WeightUnit): string => {
  return `${weight} ${unit}`;
};
