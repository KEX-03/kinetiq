import { useTranslation } from 'react-i18next';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

export default function HistoryScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Card title={t('history.title')} />
    </Screen>
  );
}
