import { randomUUID } from 'expo-crypto';
import { openDatabaseSync } from 'expo-sqlite';

export const DATABASE_NAME = 'kinetiq.db';

/** The app's single database connection. Run migrate() before querying. */
export const db = openDatabaseSync(DATABASE_NAME);

/** New primary key for any row. UUIDs keep rows unique across devices for future sync. */
export function newId(): string {
  return randomUUID();
}
