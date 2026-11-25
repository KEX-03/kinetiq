export type WeightUnit = 'kg' | 'lb';

export const KG_PER_LB = 0.45359237;

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

export function formatWeight(kg: number, unit: WeightUnit, decimals = 1): string {
  const value = fromKg(kg, unit);
  return `${Number(value.toFixed(decimals))} ${unit}`;
}
