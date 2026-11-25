/** Estimated one-rep max via the Epley formula. Returns 0 for invalid input. */
export function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/** Estimated one-rep max via the Brzycki formula. Unreliable above ~10 reps; undefined at 37+. */
export function brzycki(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0 || reps >= 37) return 0;
  return (weight * 36) / (37 - reps);
}

export const estimateOneRepMax = epley;
