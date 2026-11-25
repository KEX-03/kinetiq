import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { useThemeColors } from '@/components/theme';
import { TrendChart } from '@/components/trend-chart';
import { getExercise, type Exercise } from '@/features/exercises/exercise-store';
import {
  loadProgress,
  loadRecords,
  type ExerciseRecords,
  type ProgressPoint,
} from '@/features/progress/progress-store';
import { useSettings } from '@/features/settings/settings-provider';
import { formatShortDate } from '@/utils/time';
import { displayWeight } from '@/utils/units';

type Loaded = { exercise: Exercise; progress: ProgressPoint[]; records: ExerciseRecords };

/** Exercise detail: is the user getting stronger? Chart of best est. 1RM per workout plus PRs. */
export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const [data, setData] = useState<Loaded | null | undefined>(undefined);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const exercise = await getExercise(id);
        const loaded = exercise
          ? { exercise, progress: await loadProgress(id), records: await loadRecords(id) }
          : null;
        if (active) setData(loaded);
      })();
      return () => {
        active = false;
      };
    }, [id]),
  );

  if (data === undefined) return <Screen>{null}</Screen>;

  if (data === null) {
    return (
      <Screen>
        <Card title={t('exercise.notFound')} />
      </Screen>
    );
  }

  const { exercise, progress, records } = data;
  const details = [
    t(`muscleGroups.${exercise.muscleGroup}`),
    t(`equipment.${exercise.equipment}`),
    exercise.isCustom ? t('exercises.customBadge') : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Screen>
      <Stack.Screen options={{ title: exercise.name }} />
      <Card title={exercise.name} subtitle={details} />
      <ProgressCard progress={progress} />
      <RecordsCard records={records} />
    </Screen>
  );
}

function ProgressCard({ progress }: { progress: ProgressPoint[] }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const unitLabel = t(`units.${unit}`);

  // Bodyweight exercises logged without added weight have no meaningful 1RM; chart reps instead.
  const useReps = progress.length > 0 && progress.every((point) => point.bestE1rmKg === 0);
  const values = progress.map((point) =>
    useReps ? point.maxReps : displayWeight(point.bestE1rmKg, unit),
  );
  const title = useReps ? t('progress.mostReps') : t('progress.estimatedMax');

  if (values.length < 2) {
    return (
      <Card title={title}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          {values.length === 0 ? t('progress.noData') : t('progress.needTwo')}
        </Text>
      </Card>
    );
  }

  const first = progress[0];
  const change = Number((values.at(-1)! - values[0]).toFixed(1));
  const changeText = useReps
    ? t('progress.changeReps', { count: change, signed: formatSigned(change) })
    : t('progress.changeWeight', { signed: formatSigned(change), unit: unitLabel });
  const changeColor = change > 0 ? colors.tint : change < 0 ? colors.danger : colors.textSecondary;

  return (
    <Card title={title}>
      <View style={styles.summary}>
        <Text style={[styles.latest, { color: colors.text }]}>
          {useReps ? values.at(-1) : `${values.at(-1)} ${unitLabel}`}
        </Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {t('progress.since', { change: changeText, date: formatShortDate(first.startedAt) })}
        </Text>
      </View>
      <TrendChart
        values={values}
        startLabel={formatShortDate(first.startedAt)}
        endLabel={formatShortDate(progress.at(-1)!.startedAt)}
      />
      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {useReps ? t('progress.repsExplainer') : t('progress.e1rmExplainer')}
      </Text>
    </Card>
  );
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : value < 0 ? `−${Math.abs(value)}` : '±0';
}

function RecordsCard({ records }: { records: ExerciseRecords }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const unitLabel = t(`units.${unit}`);
  const weight = (kg: number, decimals = 1) => `${displayWeight(kg, unit, decimals).toLocaleString()} ${unitLabel}`;

  if (!records.heaviest) {
    return (
      <Card title={t('records.title')}>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('records.none')}</Text>
      </Card>
    );
  }

  const rows: { label: string; value: string; detail?: string }[] = [];
  if (records.heaviest.weightKg > 0) {
    rows.push({
      label: t('pr.kinds.weight'),
      value: `${weight(records.heaviest.weightKg)} × ${records.heaviest.reps}`,
      detail: formatShortDate(records.heaviest.at),
    });
  }
  if (records.bestE1rm && records.bestE1rm.e1rmKg > 0) {
    rows.push({
      label: t('pr.kinds.e1rm'),
      value: weight(records.bestE1rm.e1rmKg),
      detail: t('records.from', {
        set: `${displayWeight(records.bestE1rm.weightKg, unit)} × ${records.bestE1rm.reps}`,
        date: formatShortDate(records.bestE1rm.at),
      }),
    });
  }
  if (records.bestVolume && records.bestVolume.volumeKg > 0) {
    rows.push({
      label: t('pr.kinds.volume'),
      value: weight(records.bestVolume.volumeKg, 0),
      detail: formatShortDate(records.bestVolume.at),
    });
  }

  return (
    <Card title={t('records.title')}>
      {rows.map((row) => (
        <View key={row.label} style={styles.recordRow}>
          <Text style={[styles.recordLabel, { color: colors.textSecondary }]}>{row.label}</Text>
          <View style={styles.recordValue}>
            <Text style={[styles.recordNumber, { color: colors.text }]}>{row.value}</Text>
            {row.detail ? (
              <Text style={[styles.recordDetail, { color: colors.textSecondary }]}>{row.detail}</Text>
            ) : null}
          </View>
        </View>
      ))}

      <Text style={[styles.subheading, { color: colors.text }]}>{t('records.repRecords')}</Text>
      {records.repRecords.map((record) => (
        <View key={record.weightKg} style={styles.repRow}>
          <Text style={[styles.repWeight, { color: colors.text }]}>
            {record.weightKg > 0 ? weight(record.weightKg) : t('records.bodyweightOnly')}
          </Text>
          <Text style={[styles.repCount, { color: colors.text }]}>
            {t('records.reps', { count: record.reps })}
          </Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 15 },
  summary: { gap: 2 },
  latest: { fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'] },
  change: { fontSize: 15, fontWeight: '600' },
  recordRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  recordLabel: { fontSize: 15, flexShrink: 1 },
  recordValue: { alignItems: 'flex-end', flexShrink: 1 },
  recordNumber: { fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
  recordDetail: { fontSize: 13 },
  subheading: { fontSize: 17, fontWeight: '700', marginTop: 8 },
  repRow: { flexDirection: 'row', justifyContent: 'space-between', minHeight: 28, alignItems: 'center' },
  repWeight: { fontSize: 16, fontVariant: ['tabular-nums'] },
  repCount: { fontSize: 16, fontWeight: '600', fontVariant: ['tabular-nums'] },
});
