import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { useSettings } from '@/features/settings/settings-provider';
import { useRestTimer } from '@/features/timer/rest-timer-provider';
import { useActiveWorkout } from '@/features/workouts/active-workout-provider';
import { ExerciseBlock } from '@/features/workouts/exercise-block';
import {
  deleteWorkout,
  finishWorkout,
  loadWorkout,
  type WorkoutDetail,
} from '@/features/workouts/workout-store';
import { formatClockTime, formatDate, minutesBetween } from '@/utils/time';

/** Active workout (log sets) or a finished one (review and edit sets). */
export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { refreshActiveWorkout } = useActiveWorkout();
  const { skipRest } = useRestTimer();
  const [workout, setWorkout] = useState<WorkoutDetail | null | undefined>(undefined);
  /** The one exercise card showing its entry area. Unset means "the newest exercise". */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setWorkout(await loadWorkout(id));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      reload().catch((error: unknown) => Alert.alert(t('workout.loadError'), String(error)));
    }, [reload, t]),
  );

  if (workout === undefined) return <Screen>{null}</Screen>;

  if (workout === null) {
    return (
      <Screen>
        <Card title={t('workout.notFound')} />
      </Screen>
    );
  }

  const current = workout;
  const isActive = current.finishedAt === null;
  const setCount = current.exercises.reduce((total, item) => total + item.sets.length, 0);
  const effectiveExpandedId = current.exercises.some((item) => item.id === expandedId)
    ? expandedId
    : (current.exercises.at(-1)?.id ?? null);

  async function finish() {
    skipRest();
    await finishWorkout(current.id);
    await refreshActiveWorkout();
    await reload(); // stay here to show the finished summary
  }

  async function remove() {
    if (isActive) skipRest();
    await deleteWorkout(current.id);
    await refreshActiveWorkout();
    router.back();
  }

  function confirmFinish() {
    if (setCount === 0) {
      Alert.alert(t('workout.emptyTitle'), t('workout.emptyMessage'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('workout.discard'), style: 'destructive', onPress: () => remove() },
      ]);
      return;
    }
    Alert.alert(t('workout.finishTitle'), t('workout.finishMessage', { count: setCount }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('workout.finish'), onPress: () => finish() },
    ]);
  }

  function confirmDelete() {
    const title = isActive ? t('workout.discardTitle') : t('workout.deleteTitle');
    Alert.alert(title, t('workout.deleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: isActive ? t('workout.discard') : t('common.delete'),
        style: 'destructive',
        onPress: () => remove(),
      },
    ]);
  }

  const subtitle = isActive
    ? t('workout.startedAt', { time: formatClockTime(current.startedAt) })
    : t('workout.finishedSummary', {
        time: formatClockTime(current.startedAt),
        minutes: minutesBetween(current.startedAt, current.finishedAt ?? current.startedAt),
        count: setCount,
      });

  return (
    <Screen>
      <Stack.Screen
        options={{ title: isActive ? t('workout.activeTitle') : formatDate(current.startedAt) }}
      />
      <Card
        title={isActive ? t('workout.inProgress') : formatDate(current.startedAt)}
        subtitle={subtitle}
      />

      {current.exercises.map((item) => (
        <ExerciseBlock
          key={item.id}
          workoutId={current.id}
          item={item}
          unit={settings.weightUnit}
          isActive={isActive}
          expanded={item.id === effectiveExpandedId}
          onExpand={() => setExpandedId(item.id)}
          onChanged={reload}
        />
      ))}

      {isActive ? (
        <>
          <Button
            title={t('workout.addExercise')}
            variant="secondary"
            onPress={() => {
              setExpandedId(null); // the newly added exercise opens when we come back
              router.push({ pathname: '/workout/add-exercise', params: { workoutId: current.id } });
            }}
          />
          <Button title={t('workout.finish')} onPress={confirmFinish} />
          <Button title={t('workout.discard')} variant="destructive" onPress={confirmDelete} />
        </>
      ) : (
        <Button title={t('workout.deleteWorkout')} variant="destructive" onPress={confirmDelete} />
      )}
    </Screen>
  );
}
