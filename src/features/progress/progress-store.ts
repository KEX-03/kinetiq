import { db } from '@/db/client';
import { EPLEY_SQL } from '@/utils/oneRepMax';

import type { ExerciseHistory } from './records';

/** Joins sets to their workout and keeps only live rows for one exercise. */
const LIVE_SETS = `
  FROM sets s
  JOIN workouts w ON w.id = s.workout_id
  WHERE s.exercise_id = ? AND s.deleted = 0 AND w.deleted = 0`;

export type ProgressPoint = {
  workoutId: string;
  startedAt: number;
  /** Best estimated 1RM in that workout, kg. */
  bestE1rmKg: number;
  /** Most reps in a single set in that workout (used for bodyweight exercises). */
  maxReps: number;
};

/** One point per workout that included the exercise, oldest first. */
export async function loadProgress(exerciseId: string): Promise<ProgressPoint[]> {
  const rows = await db.getAllAsync<{
    workout_id: string;
    started_at: number;
    best_e1rm: number;
    max_reps: number;
  }>(
    `SELECT w.id AS workout_id, w.started_at,
       MAX(${EPLEY_SQL}) AS best_e1rm,
       MAX(s.reps) AS max_reps
     ${LIVE_SETS}
     GROUP BY w.id
     ORDER BY w.started_at`,
    exerciseId,
  );
  return rows.map((row) => ({
    workoutId: row.workout_id,
    startedAt: row.started_at,
    bestE1rmKg: row.best_e1rm,
    maxReps: row.max_reps,
  }));
}

export type ExerciseRecords = {
  heaviest: { weightKg: number; reps: number; at: number } | null;
  bestE1rm: { e1rmKg: number; weightKg: number; reps: number; at: number } | null;
  bestVolume: { volumeKg: number; at: number } | null;
  /** Most reps at each weight, heaviest weights first. */
  repRecords: { weightKg: number; reps: number }[];
};

const REP_RECORDS_LIMIT = 8;

export async function loadRecords(exerciseId: string): Promise<ExerciseRecords> {
  const heaviest = await db.getFirstAsync<{ weight_kg: number; reps: number; started_at: number }>(
    `SELECT s.weight_kg, s.reps, w.started_at ${LIVE_SETS}
     ORDER BY s.weight_kg DESC, s.reps DESC, w.started_at
     LIMIT 1`,
    exerciseId,
  );
  const bestE1rm = await db.getFirstAsync<{
    e1rm: number;
    weight_kg: number;
    reps: number;
    started_at: number;
  }>(
    `SELECT ${EPLEY_SQL} AS e1rm, s.weight_kg, s.reps, w.started_at ${LIVE_SETS}
     ORDER BY e1rm DESC, w.started_at
     LIMIT 1`,
    exerciseId,
  );
  const bestVolume = await db.getFirstAsync<{ volume: number; started_at: number }>(
    `SELECT SUM(s.weight_kg * s.reps) AS volume, w.started_at ${LIVE_SETS}
     GROUP BY w.id
     ORDER BY volume DESC, w.started_at
     LIMIT 1`,
    exerciseId,
  );
  const repRecords = await db.getAllAsync<{ weight_kg: number; reps: number }>(
    `SELECT ROUND(s.weight_kg, 2) AS weight_kg, MAX(s.reps) AS reps ${LIVE_SETS}
     GROUP BY ROUND(s.weight_kg, 2)
     ORDER BY weight_kg DESC
     LIMIT ?`,
    exerciseId,
    REP_RECORDS_LIMIT,
  );

  return {
    heaviest: heaviest
      ? { weightKg: heaviest.weight_kg, reps: heaviest.reps, at: heaviest.started_at }
      : null,
    bestE1rm: bestE1rm
      ? {
          e1rmKg: bestE1rm.e1rm,
          weightKg: bestE1rm.weight_kg,
          reps: bestE1rm.reps,
          at: bestE1rm.started_at,
        }
      : null,
    bestVolume: bestVolume ? { volumeKg: bestVolume.volume, at: bestVolume.started_at } : null,
    repRecords: repRecords.map((row) => ({ weightKg: row.weight_kg, reps: row.reps })),
  };
}

/** Bests from workouts that started before `before` (ms), for PR detection. */
export async function loadHistoryBefore(exerciseId: string, before: number): Promise<ExerciseHistory> {
  const repMaxByWeight = await db.getAllAsync<{ weight_kg: number; reps: number }>(
    `SELECT ROUND(s.weight_kg, 2) AS weight_kg, MAX(s.reps) AS reps ${LIVE_SETS}
       AND w.started_at < ?
     GROUP BY ROUND(s.weight_kg, 2)`,
    exerciseId,
    before,
  );
  const volume = await db.getFirstAsync<{ best: number | null }>(
    `SELECT MAX(volume) AS best FROM (
       SELECT SUM(s.weight_kg * s.reps) AS volume ${LIVE_SETS}
         AND w.started_at < ?
       GROUP BY w.id
     )`,
    exerciseId,
    before,
  );
  return {
    repMaxByWeight: repMaxByWeight.map((row) => ({ weightKg: row.weight_kg, reps: row.reps })),
    bestSessionVolumeKg: volume?.best ?? 0,
  };
}
