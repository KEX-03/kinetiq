import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

/** Exercise detail: progress chart and personal records. */
export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <Screen>
      <Card title={t('exercise.title')} subtitle={`#${id}`} />
      <Card title={t('exercise.chart')} />
      <Card title={t('exercise.prs')} />
    </Screen>
  );
}
