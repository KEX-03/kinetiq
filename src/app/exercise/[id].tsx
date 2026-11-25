import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';

/** Exercise detail: progress chart and personal records. */
export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Card title={t('exercise.title')} subtitle={`#${id}`} />
      <Card title={t('exercise.chart')} />
      <Card title={t('exercise.prs')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});
