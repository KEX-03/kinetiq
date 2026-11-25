import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

export default function TodayScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Card title={t('today.title')}>
        {/* TODO: create a workout row in the DB, then navigate to its id. */}
        <Button
          title={t('today.startWorkout')}
          onPress={() => router.push({ pathname: '/workout/[id]', params: { id: 'new' } })}
        />
      </Card>
    </Screen>
  );
}
