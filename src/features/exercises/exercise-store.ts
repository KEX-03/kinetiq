import { db, newId } from '@/db/client';

export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'core',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'other'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const EXERCISE_NAME_MAX_LENGTH = 60;

export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: Equipment;
  isCustom: boolean;
};

/** Raw exercises row as returned by SQLite. */
export type ExerciseRow = {
  id: string;
  name: string;
  muscle_group: MuscleGroup;
  equipment: Equipment;
  is_custom: number;
};

export function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group,
    equipment: row.equipment,
    isCustom: row.is_custom === 1,
  };
}

const SELECT_COLUMNS = 'SELECT id, name, muscle_group, equipment, is_custom FROM exercises';

/** All exercises that aren't deleted, sorted by name. */
export async function listExercises(): Promise<Exercise[]> {
  const rows = await db.getAllAsync<ExerciseRow>(
    `${SELECT_COLUMNS} WHERE deleted = 0 ORDER BY name COLLATE NOCASE`,
  );
  return rows.map(toExercise);
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const row = await db.getFirstAsync<ExerciseRow>(`${SELECT_COLUMNS} WHERE id = ?`, id);
  return row ? toExercise(row) : null;
}

export class DuplicateExerciseError extends Error {
  constructor(public readonly existing: Exercise) {
    super(`An exercise named "${existing.name}" already exists`);
  }
}

type NewExercise = { name: string; muscleGroup: MuscleGroup; equipment: Equipment };

/**
 * Saves a user-created exercise and returns it.
 * Throws DuplicateExerciseError if a non-deleted exercise already has this name (any case).
 */
export async function createCustomExercise(input: NewExercise): Promise<Exercise> {
  const name = input.name.trim().replace(/\s+/g, ' ');
  if (!name) throw new Error('Exercise name is required');

  const existing = await db.getFirstAsync<ExerciseRow>(
    `${SELECT_COLUMNS} WHERE deleted = 0 AND name = ? COLLATE NOCASE`,
    name,
  );
  if (existing) throw new DuplicateExerciseError(toExercise(existing));

  const exercise: Exercise = { id: newId(), name, muscleGroup: input.muscleGroup, equipment: input.equipment, isCustom: true };
  await db.runAsync(
    `INSERT INTO exercises (id, name, muscle_group, equipment, is_custom, updated_at, deleted)
     VALUES (?, ?, ?, ?, 1, ?, 0)`,
    exercise.id,
    exercise.name,
    exercise.muscleGroup,
    exercise.equipment,
    Date.now(),
  );
  return exercise;
}

/** Case-insensitive match where every word in the query appears somewhere in the name. */
export function matchesSearch(exercise: Exercise, query: string): boolean {
  const words = query.toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const name = exercise.name.toLocaleLowerCase();
  return words.every((word) => name.includes(word));
}
