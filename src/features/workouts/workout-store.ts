import { db, newId } from '@/db/client';
import { toExercise, type Exercise, type ExerciseRow } from '@/features/exercises/exercise-store';
import { loadHistoryBefore } from '@/features/progress/progress-store';
import { findPrs, type ExerciseHistory, type PrKind } from '@/features/progress/records';

export const MAX_WEIGHT_KG = 1000;
export const MAX_REPS = 999;

export type WorkoutSet = {
  id: string;
  exerciseId: string;
  weightKg: number;
  reps: number;
  createdAt: number;
};

export type PreviousSet = { weightKg: number; reps: number };

export type WorkoutExercise = {
  /** workout_exercises row id */
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  /** Sets from the most recent earlier workout that included this exercise. */
  previous: PreviousSet[];
  /** Bests from earlier workouts, used to spot new PRs. */
  history: ExerciseHistory;
  /** Records each set broke, by set id. Recomputed on every load so edits stay correct. */
  prsBySetId: Record<string, PrKind[]>;
};

export type WorkoutDetail = {
  id: string;
  startedAt: number;
  finishedAt: number | null;
  exercises: WorkoutExercise[];
};

export type ActiveWorkout = { id: string; startedAt: number };

export type WorkoutSummary = {
  id: string;
  startedAt: number;
  finishedAt: number;
  exerciseCount: number;
  setCount: number;
  volumeKg: number;
};

type SetRow = { id: string; exercise_id: string; weight_kg: number; reps: number; created_at: number };

function toSet(row: SetRow): WorkoutSet {
  return {
    id: row.id,
    exerciseId: row.exercise_id,
    weightKg: row.weight_kg,
    reps: row.reps,
    createdAt: row.created_at,
  };
}

/** The unfinished workout, if any. Only one can be active at a time. */
export async function getActiveWorkout(): Promise<ActiveWorkout | null> {
  const row = await db.getFirstAsync<{ id: string; started_at: number }>(
    `SELECT id, started_at FROM workouts
     WHERE deleted = 0 AND finished_at IS NULL
     ORDER BY started_at DESC LIMIT 1`,
  );
  return row ? { id: row.id, startedAt: row.started_at } : null;
}

/** Starts a workout, or returns the active one if a workout is already in progress. */
export async function startWorkout(): Promise<ActiveWorkout> {
  const existing = await getActiveWorkout();
  if (existing) return existing;

  const now = Date.now();
  const workout = { id: newId(), startedAt: now };
  await db.runAsync(
    'INSERT INTO workouts (id, started_at, finished_at, updated_at, deleted) VALUES (?, ?, NULL, ?, 0)',
    workout.id,
    now,
    now,
  );
  return workout;
}

async function getPreviousSets(exerciseId: string, before: number): Promise<PreviousSet[]> {
  const rows = await db.getAllAsync<{ weight_kg: number; reps: number }>(
    `SELECT weight_kg, reps FROM sets
     WHERE deleted = 0 AND exercise_id = ? AND workout_id = (
       SELECT w.id FROM workouts w
       JOIN sets s ON s.workout_id = w.id
       WHERE s.exercise_id = ? AND s.deleted = 0 AND w.deleted = 0 AND w.started_at < ?
       ORDER BY w.started_at DESC
       LIMIT 1
     )
     ORDER BY created_at`,
    exerciseId,
    exerciseId,
    before,
  );
  return rows.map((row) => ({ weightKg: row.weight_kg, reps: row.reps }));
}

export async function loadWorkout(id: string): Promise<WorkoutDetail | null> {
  const workout = await db.getFirstAsync<{ id: string; started_at: number; finished_at: number | null }>(
    'SELECT id, started_at, finished_at FROM workouts WHERE id = ? AND deleted = 0',
    id,
  );
  if (!workout) return null;

  const exerciseRows = await db.getAllAsync<ExerciseRow & { workout_exercise_id: string }>(
    `SELECT we.id AS workout_exercise_id, e.id, e.name, e.muscle_group, e.equipment, e.is_custom
     FROM workout_exercises we
     JOIN exercises e ON e.id = we.exercise_id
     WHERE we.workout_id = ? AND we.deleted = 0
     ORDER BY we.position`,
    id,
  );
  const setRows = await db.getAllAsync<SetRow>(
    `SELECT id, exercise_id, weight_kg, reps, created_at FROM sets
     WHERE workout_id = ? AND deleted = 0
     ORDER BY created_at`,
    id,
  );
  const sets = setRows.map(toSet);

  const exercises: WorkoutExercise[] = [];
  for (const row of exerciseRows) {
    const exerciseSets = sets.filter((set) => set.exerciseId === row.id);
    const history = await loadHistoryBefore(row.id, workout.started_at);
    const prs = findPrs(history, exerciseSets);
    exercises.push({
      id: row.workout_exercise_id,
      exercise: toExercise(row),
      sets: exerciseSets,
      previous: await getPreviousSets(row.id, workout.started_at),
      history,
      prsBySetId: Object.fromEntries(exerciseSets.map((set, index) => [set.id, prs[index]])),
    });
  }

  return { id: workout.id, startedAt: workout.started_at, finishedAt: workout.finished_at, exercises };
}

/** Adds an exercise to the end of a workout. Does nothing if it's already in the workout. */
export async function addExerciseToWorkout(workoutId: string, exerciseId: string): Promise<void> {
  await db.withExclusiveTransactionAsync(async (txn) => {
    const existing = await txn.getFirstAsync<{ id: string }>(
      'SELECT id FROM workout_exercises WHERE workout_id = ? AND exercise_id = ? AND deleted = 0',
      workoutId,
      exerciseId,
    );
    if (existing) return;

    const last = await txn.getFirstAsync<{ position: number | null }>(
      'SELECT MAX(position) AS position FROM workout_exercises WHERE workout_id = ?',
      workoutId,
    );
    await txn.runAsync(
      `INSERT INTO workout_exercises (id, workout_id, exercise_id, position, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, 0)`,
      newId(),
      workoutId,
      exerciseId,
      (last?.position ?? -1) + 1,
      Date.now(),
    );
  });
}

/** Soft-deletes an exercise from a workout, along with its sets in that workout. */
export async function removeExerciseFromWorkout(
  workoutExerciseId: string,
  workoutId: string,
  exerciseId: string,
): Promise<void> {
  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync(
      'UPDATE workout_exercises SET deleted = 1, updated_at = ? WHERE id = ?',
      now,
      workoutExerciseId,
    );
    await txn.runAsync(
      'UPDATE sets SET deleted = 1, updated_at = ? WHERE workout_id = ? AND exercise_id = ? AND deleted = 0',
      now,
      workoutId,
      exerciseId,
    );
  });
}

/** Saves a set immediately. Weight is in kg. */
export async function logSet(
  workoutId: string,
  exerciseId: string,
  weightKg: number,
  reps: number,
): Promise<WorkoutSet> {
  const now = Date.now();
  const set: WorkoutSet = { id: newId(), exerciseId, weightKg, reps, createdAt: now };
  await db.runAsync(
    `INSERT INTO sets (id, workout_id, exercise_id, weight_kg, reps, created_at, updated_at, deleted)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
    set.id,
    workoutId,
    exerciseId,
    weightKg,
    reps,
    now,
    now,
  );
  return set;
}

export async function updateSet(id: string, weightKg: number, reps: number): Promise<void> {
  await db.runAsync(
    'UPDATE sets SET weight_kg = ?, reps = ?, updated_at = ? WHERE id = ?',
    weightKg,
    reps,
    Date.now(),
    id,
  );
}

export async function deleteSet(id: string): Promise<void> {
  await db.runAsync('UPDATE sets SET deleted = 1, updated_at = ? WHERE id = ?', Date.now(), id);
}

export async function finishWorkout(id: string): Promise<void> {
  const now = Date.now();
  await db.runAsync('UPDATE workouts SET finished_at = ?, updated_at = ? WHERE id = ?', now, now, id);
}

/** Soft-deletes a workout and everything logged in it. */
export async function deleteWorkout(id: string): Promise<void> {
  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.runAsync('UPDATE workouts SET deleted = 1, updated_at = ? WHERE id = ?', now, id);
    await txn.runAsync(
      'UPDATE workout_exercises SET deleted = 1, updated_at = ? WHERE workout_id = ? AND deleted = 0',
      now,
      id,
    );
    await txn.runAsync(
      'UPDATE sets SET deleted = 1, updated_at = ? WHERE workout_id = ? AND deleted = 0',
      now,
      id,
    );
  });
}

/** Finished workouts, newest first, with totals. */
export async function listFinishedWorkouts(): Promise<WorkoutSummary[]> {
  const rows = await db.getAllAsync<{
    id: string;
    started_at: number;
    finished_at: number;
    exercise_count: number;
    set_count: number;
    volume_kg: number;
  }>(
    `SELECT w.id, w.started_at, w.finished_at,
       COUNT(DISTINCT s.exercise_id) AS exercise_count,
       COUNT(s.id) AS set_count,
       COALESCE(SUM(s.weight_kg * s.reps), 0) AS volume_kg
     FROM workouts w
     LEFT JOIN sets s ON s.workout_id = w.id AND s.deleted = 0
     WHERE w.deleted = 0 AND w.finished_at IS NOT NULL
     GROUP BY w.id
     ORDER BY w.started_at DESC`,
  );
  return rows.map((row) => ({
    id: row.id,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    exerciseCount: row.exercise_count,
    setCount: row.set_count,
    volumeKg: row.volume_kg,
  }));
}
