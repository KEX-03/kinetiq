import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Chip } from '@/components/chip';
import { TextField } from '@/components/text-field';
import { useThemeColors } from '@/components/theme';

import {
  listExercises,
  matchesSearch,
  MUSCLE_GROUPS,
  type Exercise,
  type MuscleGroup,
} from './exercise-store';

export type CreatePrefill = { name: string; muscleGroup: MuscleGroup | null };

type ExercisePickerProps = {
  onSelect: (exercise: Exercise) => void;
  /** Called when the user wants a custom exercise; prefilled from the current search and filter. */
  onCreate: (prefill: CreatePrefill) => void;
};

/** Searchable, filterable list of every exercise. Reloads whenever its screen regains focus. */
export function ExercisePicker({ onSelect, onCreate }: ExercisePickerProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<MuscleGroup | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      listExercises()
        .then((list) => {
          if (active) setExercises(list);
        })
        .catch((error: unknown) => {
          if (active) setLoadError(String(error));
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const visible = (exercises ?? []).filter(
    (exercise) => (group === null || exercise.muscleGroup === group) && matchesSearch(exercise, query),
  );
  const create = () => onCreate({ name: query.trim(), muscleGroup: group });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView edges={['top']} style={styles.header}>
        <View style={styles.searchRow}>
          <TextField
            containerStyle={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder={t('exercises.searchPlaceholder')}
            accessibilityLabel={t('exercises.searchPlaceholder')}
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="while-editing"
            returnKeyType="search"
          />
          <Button
            title={t('exercises.new')}
            variant="secondary"
            accessibilityLabel={t('exercises.createCustom')}
            onPress={create}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.chips}>
          <Chip label={t('exercises.all')} selected={group === null} onPress={() => setGroup(null)} />
          {MUSCLE_GROUPS.map((muscle) => (
            <Chip
              key={muscle}
              label={t(`muscleGroups.${muscle}`)}
              selected={group === muscle}
              onPress={() => setGroup(group === muscle ? null : muscle)}
            />
          ))}
        </ScrollView>
      </SafeAreaView>

      <FlatList
        data={visible}
        keyExtractor={(exercise) => exercise.id}
        renderItem={({ item }) => <ExerciseRow exercise={item} onPress={() => onSelect(item)} />}
        ItemSeparatorComponent={Separator}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentInsetAdjustmentBehavior="automatic"
        ListEmptyComponent={
          exercises === null ? undefined : (
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {loadError ? t('exercises.loadError') : t('exercises.noResults')}
              </Text>
              {loadError ? null : (
                <Button
                  title={
                    query.trim()
                      ? t('exercises.createNamed', { name: query.trim() })
                      : t('exercises.createCustom')
                  }
                  onPress={create}
                />
              )}
            </View>
          )
        }
      />
    </View>
  );
}

function ExerciseRow({ exercise, onPress }: { exercise: Exercise; onPress: () => void }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const details = `${t(`muscleGroups.${exercise.muscleGroup}`)} · ${t(`equipment.${exercise.equipment}`)}`;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.fill : colors.card }]}>
      <View style={styles.rowText}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {exercise.name}
        </Text>
        <Text style={[styles.details, { color: colors.textSecondary }]}>{details}</Text>
      </View>
      {exercise.isCustom ? (
        <Text style={[styles.badge, { color: colors.tint, backgroundColor: colors.fill }]}>
          {t('exercises.customBadge')}
        </Text>
      ) : null}
    </Pressable>
  );
}

function Separator() {
  const colors = useThemeColors();
  return <View style={[styles.separator, { backgroundColor: colors.fill }]} />;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, gap: 12 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  search: { flex: 1 },
  chips: { gap: 8 },
  row: {
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 17, fontWeight: '600' },
  details: { fontSize: 14 },
  badge: {
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 16 },
  empty: { padding: 24, gap: 16, alignItems: 'center' },
  emptyText: { fontSize: 16, textAlign: 'center' },
});
