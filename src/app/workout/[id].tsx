import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

/** Active workout (in progress) or a past workout (finished). */
export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();

  return (
    <Screen>
      <Card title={t('workout.title')} subtitle={`#${id}`} />
    </Screen>
  );
}
