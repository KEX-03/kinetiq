import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/components/theme';
import { useSettings } from '@/features/settings/settings-provider';
import { formatShortDate, parseDateKey } from '@/utils/time';
import { displayWeight } from '@/utils/units';

import { getLatestBodyWeight, type BodyWeightEntry } from './bodyweight-store';

/** Row that opens the body weight screen and shows the latest entry. */
export function BodyWeightLink() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { settings } = useSettings();
  const [latest, setLatest] = useState<BodyWeightEntry | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getLatestBodyWeight()
        .then((entry) => {
          if (active) setLatest(entry);
        })
        .catch(() => {});
      return () => {
        active = false;
      };
    }, []),
  );

  const unitLabel = t(`units.${settings.weightUnit}`);
  const summary = latest
    ? t('bodyWeight.latest', {
        value: `${displayWeight(latest.weightKg, settings.weightUnit)} ${unitLabel}`,
        date: formatShortDate(parseDateKey(latest.date)),
      })
    : t('bodyWeight.empty');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push('/body-weight')}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.fill : colors.card }]}>
      <View style={styles.text}>
        <Text style={[styles.title, { color: colors.text }]}>{t('bodyWeight.title')}</Text>
        <Text style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text>
      </View>
      <Text style={[styles.chevron, { color: colors.textSecondary }]}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    marginHorizontal: 16,
    marginBottom: 12,
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 17, fontWeight: '700' },
  summary: { fontSize: 14 },
  chevron: { fontSize: 28, fontWeight: '300' },
});
