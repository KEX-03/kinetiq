import { epley } from '@/utils/oneRepMax';

export type PrKind = 'weight' | 'e1rm' | 'reps' | 'volume';

export const PR_KINDS: readonly PrKind[] = ['weight', 'e1rm', 'reps', 'volume'];

/** An exercise's best results from workouts before the one being looked at. */
export type ExerciseHistory = {
  /** Most reps ever done at each distinct weight (kg). */
  repMaxByWeight: { weightKg: number; reps: number }[];
  /** Highest total weight × reps for this exercise in a single earlier workout. */
  bestSessionVolumeKg: number;
};

export const EMPTY_HISTORY: ExerciseHistory = { repMaxByWeight: [], bestSessionVolumeKg: 0 };

/** Tolerance for comparing weights that went through kg/lb conversion. */
const EPSILON = 0.01;

type SetLike = { weightKg: number; reps: number };

/**
 * Which records each set broke, in order. Sets are compared against earlier workouts and
 * earlier sets in this workout. With no earlier workouts there's nothing to beat, so no PRs.
 *
 * - weight: heavier than ever
 * - e1rm: higher estimated 1RM than ever
 * - reps: more reps than ever at this weight or heavier
 * - volume: this workout's total for the exercise passes the best earlier workout (once)
 */
export function findPrs(history: ExerciseHistory, sets: SetLike[]): PrKind[][] {
  if (history.repMaxByWeight.length === 0) return sets.map(() => []);

  const seen = [...history.repMaxByWeight];
  let bestWeight = Math.max(...seen.map((entry) => entry.weightKg));
  let bestE1rm = Math.max(...seen.map((entry) => epley(entry.weightKg, entry.reps)));
  let sessionVolume = 0;
  let volumeAwarded = false;

  return sets.map(({ weightKg, reps }) => {
    const prs: PrKind[] = [];

    if (weightKg > bestWeight + EPSILON) prs.push('weight');

    const e1rm = epley(weightKg, reps);
    if (e1rm > bestE1rm + EPSILON) prs.push('e1rm');

    const atOrAbove = seen.filter((entry) => entry.weightKg >= weightKg - EPSILON);
    if (atOrAbove.length > 0 && reps > Math.max(...atOrAbove.map((entry) => entry.reps))) {
      prs.push('reps');
    }

    sessionVolume += weightKg * reps;
    if (!volumeAwarded && sessionVolume > history.bestSessionVolumeKg + EPSILON) {
      prs.push('volume');
      volumeAwarded = true;
    }

    seen.push({ weightKg, reps });
    bestWeight = Math.max(bestWeight, weightKg);
    bestE1rm = Math.max(bestE1rm, e1rm);
    return prs;
  });
}
