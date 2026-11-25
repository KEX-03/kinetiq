import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { getExercise, type Exercise } from '@/features/exercises/exercise-store';

/** Exercise detail. The progress chart and PRs arrive in 1.6. */
export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [exercise, setExercise] = useState<Exercise | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getExercise(id).then((found) => {
        if (active) setExercise(found);
      });
      return () => {
        active = false;
      };
    }, [id]),
  );

  if (exercise === undefined) return <Screen>{null}</Screen>;

  if (exercise === null) {
    return (
      <Screen>
        <Card title={t('exercise.notFound')} />
      </Screen>
    );
  }

  const details = [
    t(`muscleGroups.${exercise.muscleGroup}`),
    t(`equipment.${exercise.equipment}`),
    exercise.isCustom ? t('exercises.customBadge') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen>
      <Stack.Screen options={{ title: exercise.name }} />
      <Card title={exercise.name} subtitle={details} />
      <Card title={t('exercise.chart')} subtitle={t('exercise.comingSoon')} />
      <Card title={t('exercise.prs')} subtitle={t('exercise.comingSoon')} />
    </Screen>
  );
}
