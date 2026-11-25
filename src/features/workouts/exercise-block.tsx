import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { NumberInput } from '@/components/number-input';
import { useThemeColors } from '@/components/theme';
import { useSettings } from '@/features/settings/settings-provider';
import { useRestTimer } from '@/features/timer/rest-timer-provider';
import { displayWeight, parseDecimal, toKg, weightStep, type WeightUnit } from '@/utils/units';

import {
  deleteSet,
  logSet,
  MAX_REPS,
  MAX_WEIGHT_KG,
  removeExerciseFromWorkout,
  updateSet,
  type PreviousSet,
  type WorkoutExercise,
  type WorkoutSet,
} from './workout-store';

type ExerciseBlockProps = {
  workoutId: string;
  item: WorkoutExercise;
  unit: WeightUnit;
  /** Active workouts can log new sets; finished ones can only edit existing sets. */
  isActive: boolean;
  /** Only one block in a workout shows its entry area at a time. */
  expanded: boolean;
  /** Asks the screen to make this block the expanded one. */
  onExpand: () => void;
  /** Called after every write so the screen reloads from the database. */
  onChanged: () => Promise<void>;
};

type Mode = { kind: 'new' } | { kind: 'edit'; set: WorkoutSet; index: number };

/** Values to pre-fill for set number `index`: last time's matching set, else this workout's last set. */
function prefillFor(item: WorkoutExercise, index: number): PreviousSet | undefined {
  return item.previous[index] ?? item.sets.at(-1) ?? item.previous.at(-1);
}

export function ExerciseBlock({
  workoutId,
  item,
  unit,
  isActive,
  expanded,
  onExpand,
  onChanged,
}: ExerciseBlockProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { settings } = useSettings();
  const { startRest } = useRestTimer();
  const unitLabel = t(`units.${unit}`);
  // Bodyweight exercises log reps only; weight is optional added load (e.g. weighted pull-ups).
  const isBodyweight = item.exercise.equipment === 'bodyweight';

  function weightToText(weightKg: number): string {
    return isBodyweight && weightKg === 0 ? '' : String(displayWeight(weightKg, unit));
  }

  const initial = prefillFor(item, item.sets.length);
  const [mode, setMode] = useState<Mode>({ kind: 'new' });
  const [weightText, setWeightText] = useState(initial ? weightToText(initial.weightKg) : '');
  const [repsText, setRepsText] = useState(initial ? String(initial.reps) : '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function fill(values: PreviousSet | undefined) {
    if (!values) return;
    setWeightText(weightToText(values.weightKg));
    setRepsText(String(values.reps));
  }

  function formatSet(values: PreviousSet | undefined): string {
    if (!values) return '—';
    if (isBodyweight && values.weightKg === 0) return t('workout.repsOnly', { count: values.reps });
    return `${displayWeight(values.weightKg, unit)} × ${values.reps}`;
  }

  /** Validates the inputs; returns kg and reps, or shows an error and returns null. */
  function readInputs(): { weightKg: number; reps: number } | null {
    const weight = isBodyweight && weightText.trim() === '' ? 0 : parseDecimal(weightText);
    const reps = parseDecimal(repsText);
    if (weight === null || toKg(weight, unit) > MAX_WEIGHT_KG) {
      setError(t('workout.invalidWeight'));
      return null;
    }
    if (reps === null || !Number.isInteger(reps) || reps < 1 || reps > MAX_REPS) {
      setError(t('workout.invalidReps', { max: MAX_REPS }));
      return null;
    }
    setError(null);
    return { weightKg: toKg(weight, unit), reps };
  }

  async function run(action: () => Promise<void>) {
    setSaving(true);
    try {
      await action();
      await onChanged();
    } catch (e) {
      Alert.alert(t('workout.saveError'), String(e));
    } finally {
      setSaving(false);
    }
  }

  function log() {
    const values = readInputs();
    if (!values) return;
    run(async () => {
      await logSet(workoutId, item.exercise.id, values.weightKg, values.reps);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      startRest(settings.restSeconds);
      // Next set: pre-fill with last time's matching set, or keep what was just logged.
      fill(item.previous[item.sets.length + 1]);
    });
  }

  function resetEntry() {
    setMode({ kind: 'new' });
    setError(null);
    fill(prefillFor(item, item.sets.length));
  }

  function expandForNewSet() {
    resetEntry();
    onExpand();
  }

  function startEdit(set: WorkoutSet, index: number) {
    onExpand();
    setMode({ kind: 'edit', set, index });
    setError(null);
    fill(set);
  }

  function saveEdit(set: WorkoutSet) {
    const values = readInputs();
    if (!values) return;
    run(async () => {
      await updateSet(set.id, values.weightKg, values.reps);
      resetEntry();
    });
  }

  function confirmDelete(set: WorkoutSet, index: number) {
    Alert.alert(t('workout.deleteSetTitle', { n: index + 1 }), undefined, [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          run(async () => {
            await deleteSet(set.id);
            resetEntry();
          }),
      },
    ]);
  }

  function confirmRemoveExercise() {
    Alert.alert(
      t('workout.removeExerciseTitle', { name: item.exercise.name }),
      t('workout.removeExerciseMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('workout.removeExercise'),
          style: 'destructive',
          onPress: () => run(() => removeExerciseFromWorkout(item.id, workoutId, item.exercise.id)),
        },
      ],
    );
  }

  // An edit left open in a block that has since collapsed is ignored.
  const editing = expanded && mode.kind === 'edit' ? mode : null;
  const showEntry = expanded && (isActive || editing !== null);
  const nextSetNumber = item.sets.length + 1;
  const entryTitle = editing
    ? t('workout.editingSet', { n: editing.index + 1 })
    : t('workout.setN', { n: nextSetNumber });
  const entryPrevious = editing ? item.previous[editing.index] : item.previous[item.sets.length];
  const weightLabel = isBodyweight ? t('workout.addedWeight', { unit: unitLabel }) : unitLabel;

  return (
    <Card style={expanded && isActive ? { borderWidth: 2, borderColor: colors.tint } : undefined}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="link"
          style={styles.titleButton}
          onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: item.exercise.id } })}>
          <Text style={[styles.title, { color: colors.tint }]}>{item.exercise.name}</Text>
        </Pressable>
        {isActive ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('workout.removeExercise')}
            onPress={confirmRemoveExercise}
            hitSlop={8}
            style={styles.removeButton}>
            <Text style={[styles.removeText, { color: colors.danger }]}>{t('workout.remove')}</Text>
          </Pressable>
        ) : null}
      </View>

      {item.sets.length > 0 ? (
        <View>
          <View style={styles.tableRow}>
            <Text style={[styles.colSet, styles.headerCell, { color: colors.textSecondary }]}>
              {t('workout.colSet')}
            </Text>
            <Text style={[styles.colWide, styles.headerCell, { color: colors.textSecondary }]}>
              {t('workout.colPrevious')}
            </Text>
            <Text style={[styles.colWide, styles.headerCell, { color: colors.textSecondary }]}>
              {t('workout.colWeightReps', { unit: unitLabel })}
            </Text>
          </View>
          {item.sets.map((set, index) => (
            <Pressable
              key={set.id}
              accessibilityRole="button"
              accessibilityHint={t('workout.tapToEdit')}
              onPress={() => startEdit(set, index)}
              style={[
                styles.tableRow,
                styles.setRow,
                editing?.set.id === set.id && { backgroundColor: colors.fill },
              ]}>
              <Text style={[styles.colSet, styles.cell, { color: colors.text }]}>{index + 1}</Text>
              <Text style={[styles.colWide, styles.cell, { color: colors.textSecondary }]}>
                {formatSet(item.previous[index])}
              </Text>
              <Text style={[styles.colWide, styles.cell, styles.bold, { color: colors.text }]}>
                {formatSet(set)}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {showEntry ? (
        <View style={[styles.entry, { borderTopColor: colors.fill }]}>
          <View style={styles.entryHeader}>
            <Text style={[styles.entryTitle, { color: colors.text }]}>{entryTitle}</Text>
            <Text style={[styles.entryPrevious, { color: colors.textSecondary }]}>
              {t('workout.previousValue', { value: formatSet(entryPrevious) })}
            </Text>
          </View>

          <NumberInput
            value={weightText}
            onChangeText={setWeightText}
            step={weightStep(unit)}
            allowDecimals
            label={weightLabel}
            decreaseLabel={t('workout.decreaseWeight', { step: weightStep(unit), unit: unitLabel })}
            increaseLabel={t('workout.increaseWeight', { step: weightStep(unit), unit: unitLabel })}
          />
          <NumberInput
            value={repsText}
            onChangeText={setRepsText}
            step={1}
            label={t('workout.reps')}
            decreaseLabel={t('workout.decreaseReps')}
            increaseLabel={t('workout.increaseReps')}
          />

          {error ? (
            <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
              {error}
            </Text>
          ) : null}

          {editing ? (
            <View style={styles.editButtons}>
              <Button title={t('common.save')} onPress={() => saveEdit(editing.set)} disabled={saving} />
              <View style={styles.editSecondary}>
                <Button
                  title={t('common.cancel')}
                  variant="secondary"
                  onPress={resetEntry}
                  style={styles.flex}
                />
                <Button
                  title={t('common.delete')}
                  variant="destructive"
                  onPress={() => confirmDelete(editing.set, editing.index)}
                  disabled={saving}
                  style={styles.flex}
                />
              </View>
            </View>
          ) : (
            <Button title={t('workout.logSet')} onPress={log} disabled={saving} />
          )}
        </View>
      ) : null}

      {isActive && !expanded ? (
        <Button
          title={t('workout.logSetN', { n: nextSetNumber })}
          variant="secondary"
          onPress={expandForNewSet}
        />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleButton: { flex: 1, minHeight: 44, justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700' },
  removeButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  removeText: { fontSize: 15, fontWeight: '600' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  setRow: { minHeight: 44, borderRadius: 8 },
  colSet: { width: 40 },
  colWide: { flex: 1 },
  headerCell: { fontSize: 13, fontWeight: '600', paddingBottom: 4 },
  cell: { fontSize: 17, fontVariant: ['tabular-nums'] },
  bold: { fontWeight: '600' },
  entry: { gap: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  entryTitle: { fontSize: 17, fontWeight: '700' },
  entryPrevious: { fontSize: 15, flexShrink: 1, textAlign: 'right' },
  error: { fontSize: 15, textAlign: 'center' },
  editButtons: { gap: 8 },
  editSecondary: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
});
