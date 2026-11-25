import { useTranslation } from 'react-i18next';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

export default function ProgressScreen() {
  const { t } = useTranslation();

  return (
    <Screen>
      <Card title={t('progress.title')} />
    </Screen>
  );
}
