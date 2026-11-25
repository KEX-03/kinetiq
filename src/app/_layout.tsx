import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { useTranslation } from 'react-i18next';

import { DATABASE_NAME } from '@/db/client';
import { migrateDbIfNeeded } from '@/db/migrate';
import '@/i18n';

export default function RootLayout() {
  const { t } = useTranslation();

  return (
    <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: t('workout.title') }} />
        <Stack.Screen name="exercise/[id]" options={{ title: t('exercise.title') }} />
      </Stack>
    </SQLiteProvider>
  );
}
