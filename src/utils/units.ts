export type WeightUnit = 'kg' | 'lb';

export const WEIGHT_UNITS: readonly WeightUnit[] = ['kg', 'lb'];

export const KG_PER_LB = 0.45359237;

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === 'kg' || value === 'lb';
}

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

/** Weights are stored in kg; convert to the user's display unit. */
export function fromKg(kg: number, unit: WeightUnit): number {
  return unit === 'kg' ? kg : kgToLb(kg);
}

/** Convert a value entered in the user's unit back to kg for storage. */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'kg' ? value : lbToKg(value);
}

/** Display value in the user's unit, rounded (default 1 decimal, trailing zeros dropped). */
export function displayWeight(kg: number, unit: WeightUnit, decimals = 1): number {
  return Number(fromKg(kg, unit).toFixed(decimals));
}
