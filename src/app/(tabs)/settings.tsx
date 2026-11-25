import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { SegmentedControl } from '@/components/segmented-control';
import { Stepper } from '@/components/stepper';
import { resetDatabase } from '@/db/migrate';
import { useSettings } from '@/features/settings/settings-provider';
import {
  REST_SECONDS_MAX,
  REST_SECONDS_MIN,
  REST_SECONDS_STEP,
  THEME_PREFERENCES,
  type Settings,
} from '@/features/settings/settings-store';
import { useActiveWorkout } from '@/features/workouts/active-workout-provider';
import { formatDuration } from '@/utils/time';
import { WEIGHT_UNITS } from '@/utils/units';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSetting, reloadSettings } = useSettings();
  const { refreshActiveWorkout } = useActiveWorkout();

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

  function confirmReset() {
    Alert.alert(t('settings.dev.resetTitle'), t('settings.dev.resetMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.dev.resetConfirm'),
        style: 'destructive',
        onPress: async () => {
          try {
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

      {__DEV__ ? (
        <Card title={t('settings.dev.title')}>
          <Button title={t('settings.dev.reset')} variant="destructive" onPress={confirmReset} />
        </Card>
      ) : null}
    </Screen>
  );
}
