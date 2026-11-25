import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { useActiveWorkout } from '@/features/workouts/active-workout-provider';
import { formatClockTime } from '@/utils/time';

/** Reopen an unfinished workout once per app launch, not every time Today is shown. */
let checkedForResume = false;

function openWorkout(id: string) {
  router.push({ pathname: '/workout/[id]', params: { id } });
}

export default function TodayScreen() {
  const { t } = useTranslation();
  const { activeWorkout, startWorkout } = useActiveWorkout();
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (checkedForResume) return;
    checkedForResume = true;
    if (activeWorkout) openWorkout(activeWorkout.id);
  }, [activeWorkout]);

  async function start() {
    setStarting(true);
    try {
      const workout = await startWorkout();
      openWorkout(workout.id);
    } catch (error) {
      Alert.alert(t('workout.saveError'), String(error));
    } finally {
      setStarting(false);
    }
  }

  return (
    <Screen>
      {activeWorkout ? (
        <Card
          title={t('today.inProgress')}
          subtitle={t('workout.startedAt', { time: formatClockTime(activeWorkout.startedAt) })}>
          <Button title={t('today.resumeWorkout')} onPress={() => openWorkout(activeWorkout.id)} />
        </Card>
      ) : (
        <Card title={t('today.title')} subtitle={t('today.subtitle')}>
          <Button title={t('today.startWorkout')} onPress={start} disabled={starting} />
        </Card>
      )}
    </Screen>
  );
}
