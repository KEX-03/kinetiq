import { db } from './client';
import { seedExercisesIfEmpty } from './seed';

/**
 * Ordered schema migrations. Never edit an entry that has shipped; append a new one.
 * PRAGMA user_version stores how many have been applied.
 *
 * Every table has id (UUID), updated_at (ms) and deleted (0/1) so rows can sync later.
 * Rows are never hard-deleted; set deleted = 1 instead.
 */
const MIGRATIONS: string[] = [
  // v1: initial schema
  `
  CREATE TABLE exercises (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    equipment TEXT NOT NULL,
    is_custom INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE workouts (
    id TEXT PRIMARY KEY NOT NULL,
    started_at INTEGER NOT NULL,
    finished_at INTEGER,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE sets (
    id TEXT PRIMARY KEY NOT NULL,
    workout_id TEXT NOT NULL REFERENCES workouts(id),
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    weight_kg REAL NOT NULL,
    reps INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_sets_exercise_created ON sets(exercise_id, created_at);
  CREATE INDEX idx_sets_workout ON sets(workout_id);

  CREATE TABLE body_weight (
    id TEXT PRIMARY KEY NOT NULL,
    date TEXT NOT NULL, -- local calendar day, YYYY-MM-DD
    weight_kg REAL NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE settings (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL UNIQUE,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
  );
  `,

  // v2: exercises added to a workout (kept even before any set is logged, and ordered)
  `
  CREATE TABLE workout_exercises (
    id TEXT PRIMARY KEY NOT NULL,
    workout_id TEXT NOT NULL REFERENCES workouts(id),
    exercise_id TEXT NOT NULL REFERENCES exercises(id),
    position INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    deleted INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX idx_workout_exercises_workout ON workout_exercises(workout_id, position);
  CREATE INDEX idx_workouts_started ON workouts(started_at);
  `,
];

/** Schema version after all migrations run (what PRAGMA user_version ends up as). */
export const SCHEMA_VERSION = MIGRATIONS.length;

async function dropAllTables(): Promise<void> {
  const tables = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
  );
  await db.execAsync('PRAGMA foreign_keys = OFF;');
  for (const { name } of tables) {
    // Table names can't be bound as parameters; these come from sqlite_master, not user input.
    await db.execAsync(`DROP TABLE IF EXISTS "${name.replaceAll('"', '""')}"`);
  }
  await db.execAsync('PRAGMA user_version = 0;');
}

async function runMigrations(): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < MIGRATIONS.length; version++) {
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.execAsync(MIGRATIONS[version]);
      // PRAGMA values can't be bound as parameters; this is an integer from our own code.
      await txn.execAsync(`PRAGMA user_version = ${version + 1}`);
    });
  }

  await seedExercisesIfEmpty(db);
}

let migration: Promise<void> | null = null;

/** Brings the database schema up to date and seeds built-in data. Safe to call more than once. */
export function migrate(): Promise<void> {
  migration ??= runMigrations().catch((error: unknown) => {
    migration = null; // allow a retry
    throw error;
  });
  return migration;
}

/** Development only: drops every table and rebuilds the schema from scratch. */
export async function resetDatabase(): Promise<void> {
  if (!__DEV__) throw new Error('resetDatabase is only available in development');

  await dropAllTables();
  migration = null;
  await migrate();
}
