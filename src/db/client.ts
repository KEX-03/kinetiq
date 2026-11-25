import { useSQLiteContext } from 'expo-sqlite';

export const DATABASE_NAME = 'kinetiq.db';

/** The app's database. Must be used under the root layout's SQLiteProvider. */
export const useDb = useSQLiteContext;
