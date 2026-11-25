import { db, newId } from '@/db/client';
import { parseDateKey } from '@/utils/time';

export const MIN_BODY_WEIGHT_KG = 20;
export const MAX_BODY_WEIGHT_KG = 400;

export type BodyWeightEntry = {
  id: string;
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  weightKg: number;
};

/** All entries, oldest first. */
export async function listBodyWeights(): Promise<BodyWeightEntry[]> {
  const rows = await db.getAllAsync<{ id: string; date: string; weight_kg: number }>(
    'SELECT id, date, weight_kg FROM body_weight WHERE deleted = 0 ORDER BY date',
  );
  return rows.map((row) => ({ id: row.id, date: row.date, weightKg: row.weight_kg }));
}

export async function getLatestBodyWeight(): Promise<BodyWeightEntry | null> {
  const row = await db.getFirstAsync<{ id: string; date: string; weight_kg: number }>(
    'SELECT id, date, weight_kg FROM body_weight WHERE deleted = 0 ORDER BY date DESC LIMIT 1',
  );
  return row ? { id: row.id, date: row.date, weightKg: row.weight_kg } : null;
}

/** One entry per day: saving again on the same day replaces that day's weight. */
export async function saveBodyWeight(date: string, weightKg: number): Promise<void> {
  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const existing = await txn.getFirstAsync<{ id: string }>(
      'SELECT id FROM body_weight WHERE date = ? AND deleted = 0',
      date,
    );
    if (existing) {
      await txn.runAsync(
        'UPDATE body_weight SET weight_kg = ?, updated_at = ? WHERE id = ?',
        weightKg,
        now,
        existing.id,
      );
    } else {
      await txn.runAsync(
        'INSERT INTO body_weight (id, date, weight_kg, updated_at, deleted) VALUES (?, ?, ?, ?, 0)',
        newId(),
        date,
        weightKg,
        now,
      );
    }
  });
}

export async function deleteBodyWeight(id: string): Promise<void> {
  await db.runAsync('UPDATE body_weight SET deleted = 1, updated_at = ? WHERE id = ?', Date.now(), id);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * For each entry (oldest first), the average of all entries in the 7 days ending that day.
 * Missing days are skipped rather than filled in.
 */
export function movingAverage(entries: BodyWeightEntry[], days = 7): number[] {
  const times = entries.map((entry) => parseDateKey(entry.date));
  return entries.map((_, index) => {
    // Rounded so daylight-saving shifts don't push a day in or out of the window.
    const windowStart = times[index] - (days - 1) * DAY_MS - DAY_MS / 2;
    let sum = 0;
    let count = 0;
    for (let i = index; i >= 0 && times[i] >= windowStart; i--) {
      sum += entries[i].weightKg;
      count++;
    }
    return sum / count;
  });
}
