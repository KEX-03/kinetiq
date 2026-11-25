import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';

export default function TodayScreen() {
  const { t } = useTranslation();

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
      <Card title={t('today.title')}>
        {/* TODO: create a workout row in the DB, then navigate to its id. */}
        <Button title={t('today.startWorkout')} onPress={() => router.push({ pathname: '/workout/[id]', params: { id: 'new' } })}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});
