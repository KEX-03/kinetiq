import type { SQLiteDatabase } from 'expo-sqlite';

import { seedDb } from './seed';

/**
 * Ordered schema migrations. Never edit a shipped entry; append a new one.
 * The DB's `user_version` records how many have been applied.
 */
const MIGRATIONS: string[] = [
  `
  CREATE TABLE exercises (
    id INTEGER PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    muscle_group TEXT,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE workouts (
    id INTEGER PRIMARY KEY NOT NULL,
    started_at INTEGER NOT NULL DEFAULT (unixepoch()),
    finished_at INTEGER,
    notes TEXT
  );

  CREATE TABLE sets (
    id INTEGER PRIMARY KEY NOT NULL,
    workout_id INTEGER NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
    exercise_id INTEGER NOT NULL REFERENCES exercises(id),
    position INTEGER NOT NULL,
    weight_kg REAL,
    reps INTEGER,
    completed_at INTEGER
  );
  CREATE INDEX sets_workout_idx ON sets(workout_id);
  CREATE INDEX sets_exercise_idx ON sets(exercise_id);

  CREATE TABLE bodyweight (
    id INTEGER PRIMARY KEY NOT NULL,
    measured_at INTEGER NOT NULL DEFAULT (unixepoch()),
    weight_kg REAL NOT NULL
  );

  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
  `,
];

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= MIGRATIONS.length) return;

  await db.withExclusiveTransactionAsync(async (txn) => {
    for (let v = current; v < MIGRATIONS.length; v++) {
      await txn.execAsync(MIGRATIONS[v]);
    }
    if (current === 0) await seedDb(txn);
    await txn.execAsync(`PRAGMA user_version = ${MIGRATIONS.length}`);
  });
}
