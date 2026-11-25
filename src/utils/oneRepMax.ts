/**
 * Estimated one-rep max (Epley). A single rep is already a 1RM, so it's returned as-is.
 * Returns 0 for invalid input.
 */
export function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * The same formula as epley(), as a SQL expression over a `sets` table aliased `s`.
 * Keep the two in sync.
 */
export const EPLEY_SQL = 'CASE WHEN s.reps = 1 THEN s.weight_kg ELSE s.weight_kg * (1 + s.reps / 30.0) END';
