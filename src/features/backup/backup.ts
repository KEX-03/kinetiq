import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { db } from '@/db/client';
import { SCHEMA_VERSION } from '@/db/migrate';
import { EQUIPMENT, MUSCLE_GROUPS } from '@/features/exercises/exercise-store';
import { MAX_BODY_WEIGHT_KG } from '@/features/bodyweight/bodyweight-store';
import { MAX_REPS, MAX_WEIGHT_KG } from '@/features/workouts/workout-store';
import { localDateKey } from '@/utils/time';

const APP_ID = 'kinetiq';
const FORMAT_VERSION = 1;
/** Oldest schema a backup can come from. v2 added workout_exercises, which workouts need. */
const MIN_SCHEMA_VERSION = 2;
const MAX_FILE_CHARS = 50_000_000;

type Row = Record<string, string | number | null>;
type Check = (value: unknown) => boolean;

const isId: Check = (v) => typeof v === 'string' && v.length > 0 && v.length <= 64;
const isText = (max: number): Check => (v) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
const isInt = (min: number, max: number): Check => (v) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
const isNumber = (min: number, max: number): Check => (v) =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isFlag: Check = (v) => v === 0 || v === 1;
const isTime = isInt(0, 8_640_000_000_000_000);
const nullable = (check: Check): Check => (v) => v === null || check(v);
const oneOf = (values: readonly string[]): Check => (v) => typeof v === 'string' && values.includes(v);
const isDateKey: Check = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v);

/**
 * Every table and column in a backup, in foreign-key order (parents first).
 * Table and column names come only from here, never from the file, so they're safe in SQL.
 */
const TABLES = {
  exercises: {
    id: isId,
    name: isText(200),
    muscle_group: oneOf(MUSCLE_GROUPS),
    equipment: oneOf(EQUIPMENT),
    is_custom: isFlag,
    updated_at: isTime,
    deleted: isFlag,
  },
  workouts: {
    id: isId,
    started_at: isTime,
    finished_at: nullable(isTime),
    updated_at: isTime,
    deleted: isFlag,
  },
  workout_exercises: {
    id: isId,
    workout_id: isId,
    exercise_id: isId,
    position: isInt(0, 1_000_000),
    updated_at: isTime,
    deleted: isFlag,
  },
  sets: {
    id: isId,
    workout_id: isId,
    exercise_id: isId,
    weight_kg: isNumber(0, MAX_WEIGHT_KG),
    reps: isInt(1, MAX_REPS),
    created_at: isTime,
    updated_at: isTime,
    deleted: isFlag,
  },
  body_weight: {
    id: isId,
    date: isDateKey,
    weight_kg: isNumber(0, MAX_BODY_WEIGHT_KG),
    updated_at: isTime,
    deleted: isFlag,
  },
  settings: {
    id: isId,
    key: isText(64),
    value: (v) => typeof v === 'string' && v.length <= 200,
    updated_at: isTime,
    deleted: isFlag,
  },
} satisfies Record<string, Record<string, Check>>;

type TableName = keyof typeof TABLES;
const TABLE_NAMES = Object.keys(TABLES) as TableName[];

export type Backup = {
  app: typeof APP_ID;
  formatVersion: number;
  schemaVersion: number;
  exportedAt: number;
  data: Record<TableName, Row[]>;
};

export type BackupSummary = {
  exportedAt: number;
  workouts: number;
  sets: number;
  bodyWeights: number;
  customExercises: number;
};

export type BackupErrorReason = 'notJson' | 'notKinetiq' | 'newerVersion' | 'tooOld' | 'tooLarge' | 'invalidData';

/** A backup file that can't be imported. `detail` says where, for invalidData. */
export class BackupError extends Error {
  constructor(
    public readonly reason: BackupErrorReason,
    public readonly detail?: string,
  ) {
    super(detail ? `${reason}: ${detail}` : reason);
  }
}

function columnsOf(table: TableName): string[] {
  return Object.keys(TABLES[table]);
}

/** Everything in the database, including soft-deleted rows, so a restore is exact. */
async function createBackup(): Promise<Backup> {
  const data = {} as Record<TableName, Row[]>;
  for (const table of TABLE_NAMES) {
    data[table] = await db.getAllAsync<Row>(`SELECT ${columnsOf(table).join(', ')} FROM ${table}`);
  }
  return { app: APP_ID, formatVersion: FORMAT_VERSION, schemaVersion: SCHEMA_VERSION, exportedAt: Date.now(), data };
}

/** Writes a JSON backup and opens the share sheet so the user can save or send it. */
export async function exportBackup(dialogTitle: string): Promise<void> {
  const backup = await createBackup();
  const file = new File(Paths.cache, `kinetiq-backup-${localDateKey()}.json`);
  if (file.exists) file.delete();
  file.create();
  await file.write(JSON.stringify(backup));

  if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is not available on this device');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Checks a parsed file in full. Returns a clean backup (only known columns) or throws BackupError. */
export function validateBackup(value: unknown): Backup {
  if (!isObject(value) || value.app !== APP_ID || value.formatVersion !== FORMAT_VERSION) {
    throw new BackupError('notKinetiq');
  }
  const schemaVersion = value.schemaVersion;
  if (typeof schemaVersion !== 'number' || !Number.isInteger(schemaVersion)) throw new BackupError('notKinetiq');
  if (schemaVersion > SCHEMA_VERSION) throw new BackupError('newerVersion');
  if (schemaVersion < MIN_SCHEMA_VERSION) throw new BackupError('tooOld');
  if (!isTime(value.exportedAt) || !isObject(value.data)) throw new BackupError('notKinetiq');

  const rawData = value.data;
  const data = {} as Record<TableName, Row[]>;
  const ids = {} as Record<TableName, Set<string>>;

  for (const table of TABLE_NAMES) {
    const rows = rawData[table];
    if (!Array.isArray(rows)) throw new BackupError('invalidData', table);
    const checks: Record<string, Check> = TABLES[table];
    ids[table] = new Set();

    data[table] = rows.map((raw: unknown, index) => {
      if (!isObject(raw)) throw new BackupError('invalidData', `${table} #${index + 1}`);
      const row: Row = {};
      for (const [column, check] of Object.entries(checks)) {
        if (!check(raw[column])) throw new BackupError('invalidData', `${table} #${index + 1} ${column}`);
        row[column] = raw[column] as Row[string];
      }
      const id = row.id as string;
      if (ids[table].has(id)) throw new BackupError('invalidData', `${table} #${index + 1} id`);
      ids[table].add(id);
      return row;
    });
  }

  // Every set and workout exercise must point at a workout and exercise in the same backup.
  for (const table of ['workout_exercises', 'sets'] as const) {
    data[table].forEach((row, index) => {
      if (!ids.workouts.has(row.workout_id as string)) {
        throw new BackupError('invalidData', `${table} #${index + 1} workout_id`);
      }
      if (!ids.exercises.has(row.exercise_id as string)) {
        throw new BackupError('invalidData', `${table} #${index + 1} exercise_id`);
      }
    });
  }
  const keys = new Set<string>();
  data.settings.forEach((row, index) => {
    if (keys.has(row.key as string)) throw new BackupError('invalidData', `settings #${index + 1} key`);
    keys.add(row.key as string);
  });

  return { app: APP_ID, formatVersion: FORMAT_VERSION, schemaVersion, exportedAt: value.exportedAt as number, data };
}

export function summarizeBackup(backup: Backup): BackupSummary {
  const live = (rows: Row[]) => rows.filter((row) => row.deleted === 0);
  return {
    exportedAt: backup.exportedAt,
    workouts: live(backup.data.workouts).length,
    sets: live(backup.data.sets).length,
    bodyWeights: live(backup.data.body_weight).length,
    customExercises: live(backup.data.exercises).filter((row) => row.is_custom === 1).length,
  };
}

/** Lets the user pick a backup file and validates it. Returns null if they cancel. */
export async function pickBackup(): Promise<Backup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled || result.assets.length === 0) return null;

  const text = await new File(result.assets[0].uri).text();
  if (text.length > MAX_FILE_CHARS) throw new BackupError('tooLarge');
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError('notJson');
  }
  return validateBackup(parsed);
}

/**
 * Replaces all data with the backup, in one transaction (all or nothing).
 * Existing rows are soft-deleted rather than removed, then backup rows are written over them
 * by id. Restored rows get a fresh updated_at so a future sync treats the restore as newest.
 */
export async function restoreBackup(backup: Backup): Promise<void> {
  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    for (const table of TABLE_NAMES) {
      await txn.runAsync(`UPDATE ${table} SET deleted = 1, updated_at = ? WHERE deleted = 0`, now);
    }

    for (const table of TABLE_NAMES) {
      const columns = columnsOf(table);
      // settings.key is unique too: match on it so the local row is reused.
      const target = table === 'settings' ? 'key' : 'id';
      const updates = columns
        .filter((column) => column !== target && column !== 'id')
        .map((column) => `${column} = excluded.${column}`)
        .join(', ');
      const statement = await txn.prepareAsync(
        `INSERT INTO ${table} (${columns.join(', ')})
         VALUES (${columns.map(() => '?').join(', ')})
         ON CONFLICT(${target}) DO UPDATE SET ${updates}`,
      );
      try {
        for (const row of backup.data[table]) {
          await statement.executeAsync(
            columns.map((column) => (column === 'updated_at' ? now : row[column])),
          );
        }
      } finally {
        await statement.finalizeAsync();
      }
    }
  });
}
