import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { Card } from '@/components/card';

export default function ProgressScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Card title={t('progress.title')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});
