import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ANDROID_TOP_EDGES } from '@/components/screen';
import { useThemeColors } from '@/components/theme';
import { useSettings } from '@/features/settings/settings-provider';
import { listFinishedWorkouts, type WorkoutSummary } from '@/features/workouts/workout-store';
import { formatClockTime, formatDate, minutesBetween } from '@/utils/time';
import { displayWeight } from '@/utils/units';

export default function HistoryScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null);
  const [loadError, setLoadError] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listFinishedWorkouts()
        .then((list) => {
          if (active) setWorkouts(list);
        })
        .catch(() => {
          if (active) setLoadError(true);
        });
      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <SafeAreaView edges={ANDROID_TOP_EDGES} style={[styles.root, { backgroundColor: colors.background }]}>
      <FlatList
        data={workouts ?? []}
        keyExtractor={(workout) => workout.id}
        renderItem={({ item }) => <WorkoutRow workout={item} />}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <Text style={[styles.heading, { color: colors.text }]}>{t('history.title')}</Text>
        }
        ListEmptyComponent={
          workouts === null && !loadError ? undefined : (
            <Text style={[styles.empty, { color: colors.textSecondary }]}>
              {loadError ? t('history.loadError') : t('history.empty')}
            </Text>
          )
        }
      />
    </SafeAreaView>
  );
}

function WorkoutRow({ workout }: { workout: WorkoutSummary }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const volume = displayWeight(workout.volumeKg, unit, 0).toLocaleString();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.fill : colors.card }]}>
      <View style={styles.rowTop}>
        <Text style={[styles.date, { color: colors.text }]}>{formatDate(workout.startedAt)}</Text>
        <Text style={[styles.meta, { color: colors.textSecondary }]}>
          {t('history.timeAndDuration', {
            time: formatClockTime(workout.startedAt),
            minutes: minutesBetween(workout.startedAt, workout.finishedAt),
          })}
        </Text>
      </View>
      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {[
          t('history.exerciseCount', { count: workout.exerciseCount }),
          t('history.setCount', { count: workout.setCount }),
          t('history.volume', { volume, unit: t(`units.${unit}`) }),
        ].join(' · ')}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 12 },
  heading: { fontSize: 34, fontWeight: '700', marginBottom: 4 },
  empty: { fontSize: 16, textAlign: 'center', paddingVertical: 32 },
  row: { padding: 16, borderRadius: 16, borderCurve: 'continuous', gap: 6, minHeight: 72 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  date: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  meta: { fontSize: 15 },
});
