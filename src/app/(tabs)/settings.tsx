import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AppState } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { Stepper } from '@/components/stepper';
import { resetDatabase } from '@/db/migrate';
import {
  BackupError,
  exportBackup,
  pickBackup,
  restoreBackup,
  summarizeBackup,
  type Backup,
} from '@/features/backup/backup';
import { useSettings } from '@/features/settings/settings-provider';
import {
  REST_SECONDS_MAX,
  REST_SECONDS_MIN,
  REST_SECONDS_STEP,
  THEME_PREFERENCES,
  type Settings,
} from '@/features/settings/settings-store';
import { allowExactRestAlerts, canImproveRestAlerts } from '@/features/timer/rest-notifications';
import { useRestTimer } from '@/features/timer/rest-timer-provider';
import { useActiveWorkout } from '@/features/workouts/active-workout-provider';
import { formatClockTime, formatDate, formatDuration } from '@/utils/time';
import { WEIGHT_UNITS } from '@/utils/units';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSetting, reloadSettings } = useSettings();
  const { refreshActiveWorkout } = useActiveWorkout();
  const { skipRest } = useRestTimer();
  const [busy, setBusy] = useState(false);
  const [alertsMayBeLate, setAlertsMayBeLate] = useState(false);

  // Re-check when the screen is shown and when returning from the system settings screen.
  const checkRestAlerts = useCallback(() => {
    canImproveRestAlerts().then(setAlertsMayBeLate);
  }, []);
  useFocusEffect(checkRestAlerts);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') checkRestAlerts();
    });
    return () => subscription.remove();
  }, [checkRestAlerts]);

  async function allowRestAlerts() {
    await allowExactRestAlerts();
    checkRestAlerts();
  }

  async function change<K extends keyof Settings>(key: K, value: Settings[K]) {
    try {
      await updateSetting(key, value);
    } catch (error) {
      Alert.alert(t('settings.saveError'), String(error));
    }
  }

  function changeRest(delta: number) {
    const next = Math.min(REST_SECONDS_MAX, Math.max(REST_SECONDS_MIN, settings.restSeconds + delta));
    change('restSeconds', next);
  }

  async function exportData() {
    setBusy(true);
    try {
      await exportBackup(t('backup.shareTitle'));
    } catch (error) {
      Alert.alert(t('backup.exportFailed'), String(error));
    } finally {
      setBusy(false);
    }
  }

  async function importData() {
    setBusy(true);
    let backup: Backup | null;
    try {
      backup = await pickBackup();
    } catch (error) {
      setBusy(false);
      Alert.alert(t('backup.importFailed'), describeBackupError(error));
      return;
    }
    setBusy(false);
    if (!backup) return;

    const chosen = backup;
    const summary = summarizeBackup(chosen);
    Alert.alert(
      t('backup.confirmTitle'),
      t('backup.confirmMessage', {
        date: `${formatDate(summary.exportedAt)} ${formatClockTime(summary.exportedAt)}`,
        workouts: summary.workouts,
        sets: summary.sets,
        bodyWeights: summary.bodyWeights,
        customExercises: summary.customExercises,
      }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('backup.replace'),
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              skipRest();
              await restoreBackup(chosen);
              await reloadSettings();
              await refreshActiveWorkout();
              Alert.alert(t('backup.restoredTitle'), t('backup.restoredMessage'));
            } catch (error) {
              Alert.alert(t('backup.importFailed'), String(error));
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  }

  function describeBackupError(error: unknown): string {
    if (!(error instanceof BackupError)) return String(error);
    const message = t(`backup.errors.${error.reason}`);
    return error.detail ? `${message}\n\n${t('backup.errors.where', { detail: error.detail })}` : message;
  }

  function confirmReset() {
    Alert.alert(t('settings.dev.resetTitle'), t('settings.dev.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.dev.resetConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            skipRest();
            await resetDatabase();
            await reloadSettings();
            await refreshActiveWorkout();
          } catch (error) {
            Alert.alert(t('settings.saveError'), String(error));
          }
        },
      },
    ]);
  }

  return (
    <Screen>
      <Card title={t('settings.weightUnit')}>
        <SegmentedControl
          options={WEIGHT_UNITS.map((unit) => ({ value: unit, label: t(`units.${unit}`) }))}
          value={settings.weightUnit}
          onChange={(unit) => change('weightUnit', unit)}
        />
      </Card>

      <Card title={t('settings.restTime')} subtitle={t('settings.restTimeHint')}>
        <Stepper
          label={formatDuration(settings.restSeconds)}
          decrementLabel={t('settings.restDecrease', { seconds: REST_SECONDS_STEP })}
          incrementLabel={t('settings.restIncrease', { seconds: REST_SECONDS_STEP })}
          canDecrement={settings.restSeconds > REST_SECONDS_MIN}
          canIncrement={settings.restSeconds < REST_SECONDS_MAX}
          onDecrement={() => changeRest(-REST_SECONDS_STEP)}
          onIncrement={() => changeRest(REST_SECONDS_STEP)}
        />
      </Card>

      {alertsMayBeLate ? (
        <Card title={t('timer.exactCardTitle')} subtitle={t('timer.exactCardHint')}>
          <Button title={t('timer.exactCardButton')} variant="secondary" onPress={allowRestAlerts} />
        </Card>
      ) : null}

      <Card title={t('settings.theme')}>
        <SegmentedControl
          options={THEME_PREFERENCES.map((theme) => ({
            value: theme,
            label: t(`settings.themes.${theme}`),
          }))}
          value={settings.theme}
          onChange={(theme) => change('theme', theme)}
        />
      </Card>

      <Card title={t('backup.title')} subtitle={t('backup.hint')}>
        <Button title={t('backup.export')} variant="secondary" onPress={exportData} disabled={busy} />
        <Button title={t('backup.import')} variant="secondary" onPress={importData} disabled={busy} />
      </Card>

      {__DEV__ ? (
        <Card title={t('settings.dev.title')}>
          <Button title={t('settings.dev.reset')} variant="destructive" onPress={confirmReset} />
        </Card>
      ) : null}
    </Screen>
  );
}
