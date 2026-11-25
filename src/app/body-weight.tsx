import * as Haptics from 'expo-haptics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { NumberInput } from '@/components/number-input';
import { Screen } from '@/components/screen';
import { useThemeColors } from '@/components/theme';
import { TrendChart } from '@/components/trend-chart';
import {
  deleteBodyWeight,
  listBodyWeights,
  MAX_BODY_WEIGHT_KG,
  MIN_BODY_WEIGHT_KG,
  movingAverage,
  saveBodyWeight,
  type BodyWeightEntry,
} from '@/features/bodyweight/bodyweight-store';
import { useSettings } from '@/features/settings/settings-provider';
import { formatDate, formatShortDate, localDateKey, parseDateKey } from '@/utils/time';
import { displayWeight, fromKg, parseDecimal, toKg } from '@/utils/units';

const CHART_ENTRIES = 90;
const RECENT_ENTRIES = 14;

export default function BodyWeightScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const unitLabel = t(`units.${unit}`);

  const today = localDateKey();
  const [entries, setEntries] = useState<BodyWeightEntry[] | null>(null);
  /** Day being logged; defaults to today, can go back to fill in a missed day. */
  const [date, setDate] = useState(today);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const list = await listBodyWeights();
    setEntries(list);
    return list;
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload()
        .then((list) => {
          // Pre-fill with today's entry, or the most recent one.
          const latest = list.at(-1);
          if (latest) setText(String(displayWeight(latest.weightKg, unit)));
        })
        .catch((e: unknown) => Alert.alert(t('bodyWeight.loadError'), String(e)));
    }, [reload, unit, t]),
  );

  const selectedEntry = entries?.find((entry) => entry.date === date);
  const isToday = date === today;

  function shiftDay(days: number) {
    const shifted = new Date(parseDateKey(date));
    shifted.setDate(shifted.getDate() + days);
    const next = localDateKey(shifted);
    if (next > today) return;
    setDate(next);
    setError(null);
    // Show that day's weight if logged, otherwise keep the current value as a starting point.
    const existing = entries?.find((entry) => entry.date === next);
    if (existing) setText(String(displayWeight(existing.weightKg, unit)));
  }

  async function save() {
    const value = parseDecimal(text);
    const kg = value === null ? null : toKg(value, unit);
    if (kg === null || kg < MIN_BODY_WEIGHT_KG || kg > MAX_BODY_WEIGHT_KG) {
      setError(
        t('bodyWeight.invalid', {
          min: Math.round(fromKg(MIN_BODY_WEIGHT_KG, unit)),
          max: Math.round(fromKg(MAX_BODY_WEIGHT_KG, unit)),
          unit: unitLabel,
        }),
      );
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await saveBodyWeight(date, kg);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await reload();
    } catch (e) {
      Alert.alert(t('bodyWeight.saveError'), String(e));
    } finally {
      setSaving(false);
    }
  }

  function confirmDelete(entry: BodyWeightEntry) {
    Alert.alert(
      t('bodyWeight.deleteTitle'),
      `${formatDate(parseDateKey(entry.date))} · ${displayWeight(entry.weightKg, unit)} ${unitLabel}`,
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            await deleteBodyWeight(entry.id);
            await reload();
          },
        },
      ],
    );
  }

  const chartEntries = (entries ?? []).slice(-CHART_ENTRIES);
  const average = movingAverage(entries ?? []).slice(-CHART_ENTRIES);
  const recent = (entries ?? []).slice(-RECENT_ENTRIES).reverse();

  return (
    <Screen>
      <Card>
        <View style={styles.dayRow}>
          <DayButton symbol="‹" label={t('bodyWeight.previousDay')} onPress={() => shiftDay(-1)} />
          <View style={styles.dayText}>
            <Text style={[styles.dayTitle, { color: colors.text }]}>
              {isToday ? t('bodyWeight.today') : formatDate(parseDateKey(date))}
            </Text>
            <Text style={[styles.daySubtitle, { color: colors.textSecondary }]}>
              {selectedEntry
                ? t('bodyWeight.logged', {
                    value: `${displayWeight(selectedEntry.weightKg, unit)} ${unitLabel}`,
                  })
                : t('bodyWeight.notLogged')}
            </Text>
          </View>
          <DayButton
            symbol="›"
            label={t('bodyWeight.nextDay')}
            onPress={() => shiftDay(1)}
            disabled={isToday}
          />
        </View>
        <NumberInput
          value={text}
          onChangeText={setText}
          step={unit === 'kg' ? 0.1 : 0.2}
          allowDecimals
          label={unitLabel}
          decreaseLabel={t('bodyWeight.decrease')}
          increaseLabel={t('bodyWeight.increase')}
        />
        {error ? (
          <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
            {error}
          </Text>
        ) : null}
        <Button
          title={selectedEntry ? t('bodyWeight.update') : t('bodyWeight.save')}
          onPress={save}
          disabled={saving}
        />
      </Card>

      <Card title={t('bodyWeight.trend')}>
        {chartEntries.length >= 2 ? (
          <>
            <TrendChart
              values={chartEntries.map((entry) => displayWeight(entry.weightKg, unit))}
              secondaryValues={average.map((value) => displayWeight(value, unit))}
              primaryColor={colors.textSecondary}
              secondaryColor={colors.tint}
              startLabel={formatShortDate(parseDateKey(chartEntries[0].date))}
              endLabel={formatShortDate(parseDateKey(chartEntries.at(-1)!.date))}
            />
            <View style={styles.legend}>
              <LegendItem color={colors.textSecondary} label={t('bodyWeight.daily')} thin />
              <LegendItem color={colors.tint} label={t('bodyWeight.average')} />
            </View>
          </>
        ) : (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('bodyWeight.needTwo')}</Text>
        )}
      </Card>

      {recent.length > 0 ? (
        <Card title={t('bodyWeight.recent')} subtitle={t('bodyWeight.tapToDelete')}>
          {recent.map((entry) => (
            <Pressable
              key={entry.id}
              accessibilityRole="button"
              accessibilityHint={t('bodyWeight.tapToDelete')}
              onPress={() => confirmDelete(entry)}
              style={({ pressed }) => [styles.entryRow, pressed && { backgroundColor: colors.fill }]}>
              <Text style={[styles.entryDate, { color: colors.text }]}>
                {formatDate(parseDateKey(entry.date))}
              </Text>
              <Text style={[styles.entryValue, { color: colors.text }]}>
                {displayWeight(entry.weightKg, unit)} {unitLabel}
              </Text>
            </Pressable>
          ))}
        </Card>
      ) : null}
    </Screen>
  );
}

type DayButtonProps = { symbol: string; label: string; onPress: () => void; disabled?: boolean };

function DayButton({ symbol, label, onPress, disabled = false }: DayButtonProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.dayButton,
        { backgroundColor: colors.fill },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.daySymbol, { color: colors.tint }]}>{symbol}</Text>
    </Pressable>
  );
}

function LegendItem({ color, label, thin }: { color: string; label: string; thin?: boolean }) {
  const colors = useThemeColors();
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendLine, { backgroundColor: color, height: thin ? 2 : 4 }]} />
      <Text style={[styles.legendText, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  error: { fontSize: 15, textAlign: 'center' },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dayText: { flex: 1, alignItems: 'center', gap: 2 },
  dayTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  daySubtitle: { fontSize: 14, textAlign: 'center' },
  dayButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySymbol: { fontSize: 28, fontWeight: '600' },
  dimmed: { opacity: 0.35 },
  hint: { fontSize: 15 },
  legend: { flexDirection: 'row', gap: 16, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 20, borderRadius: 2 },
  legendText: { fontSize: 13 },
  entryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  entryDate: { fontSize: 16 },
  entryValue: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
