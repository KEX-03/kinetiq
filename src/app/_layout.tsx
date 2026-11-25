import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

import { LoadingScreen } from '@/components/loading-screen';
import { migrate } from '@/db/migrate';
import { SettingsProvider } from '@/features/settings/settings-provider';
import { applyTheme, loadSettings, type Settings } from '@/features/settings/settings-store';
import '@/i18n';

type Startup =
  | { status: 'loading' }
  | { status: 'ready'; settings: Settings }
  | { status: 'error'; message: string };

export default function RootLayout() {
  const { t } = useTranslation();
  const [startup, setStartup] = useState<Startup>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        await migrate();
        const settings = await loadSettings();
        applyTheme(settings.theme);
        if (!cancelled) setStartup({ status: 'ready', settings });
      } catch (error) {
        if (!cancelled) setStartup({ status: 'error', message: String(error) });
      }
    }

    start();
    return () => {
      cancelled = true;
    };
  }, []);

  if (startup.status === 'loading') {
    return <LoadingScreen message={t('startup.loading')} />;
  }
  if (startup.status === 'error') {
    return <LoadingScreen message={t('startup.error')} error={startup.message} />;
  }

  return (
    <SettingsProvider initialSettings={startup.settings}>
      <AppNavigator />
    </SettingsProvider>
  );
}

function AppNavigator() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="workout/[id]" options={{ title: t('workout.title') }} />
        <Stack.Screen name="exercise/[id]" options={{ title: t('exercise.title') }} />
        <Stack.Screen
          name="exercise/new"
          options={{ title: t('exercises.form.title'), presentation: 'modal' }}
        />
      </Stack>
    </ThemeProvider>
  );
}
