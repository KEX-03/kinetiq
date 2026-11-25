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

/** Step for the weight +/− buttons, in the user's unit. */
export function weightStep(unit: WeightUnit): number {
  return unit === 'kg' ? 2.5 : 5;
}

/**
 * Parses a number typed by the user. Accepts "," as the decimal separator, since many
 * locales' decimal pads show a comma. Returns null for empty or invalid input.
 */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!/^\d*\.?\d+$|^\d+\.$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Display value in the user's unit, rounded (default 1 decimal, trailing zeros dropped). */
export function displayWeight(kg: number, unit: WeightUnit, decimals = 1): number {
  return Number(fromKg(kg, unit).toFixed(decimals));
}
