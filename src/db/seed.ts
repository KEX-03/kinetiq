import type { SQLiteDatabase } from 'expo-sqlite';

const DEFAULT_EXERCISES: [name: string, muscleGroup: string][] = [
  ['Back Squat', 'legs'],
  ['Deadlift', 'back'],
  ['Bench Press', 'chest'],
  ['Overhead Press', 'shoulders'],
  ['Barbell Row', 'back'],
  ['Pull-up', 'back'],
];

/** Inserts starter data into a freshly created database. */
export async function seedDb(db: SQLiteDatabase): Promise<void> {
  for (const [name, muscleGroup] of DEFAULT_EXERCISES) {
    await db.runAsync(
      'INSERT OR IGNORE INTO exercises (name, muscle_group) VALUES (?, ?)',
      name,
      muscleGroup,
    );
  }
}
