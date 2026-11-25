import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/button';
import { Card } from '@/components/card';
import { Chip } from '@/components/chip';
import { Screen } from '@/components/screen';
import { TextField } from '@/components/text-field';
import { useThemeColors } from '@/components/theme';
import {
  createCustomExercise,
  DuplicateExerciseError,
  EQUIPMENT,
  EXERCISE_NAME_MAX_LENGTH,
  MUSCLE_GROUPS,
  type Equipment,
  type MuscleGroup,
} from '@/features/exercises/exercise-store';

function isMuscleGroup(value: unknown): value is MuscleGroup {
  return MUSCLE_GROUPS.includes(value as MuscleGroup);
}

/** Form for a user-created exercise (is_custom = 1). Opened as a modal. */
export default function NewExerciseScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ name?: string; muscleGroup?: string }>();

  const [name, setName] = useState(params.name ?? '');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(
    isMuscleGroup(params.muscleGroup) ? params.muscleGroup : null,
  );
  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim()) return setError(t('exercises.form.nameRequired'));
    if (!muscleGroup) return setError(t('exercises.form.muscleRequired'));
    if (!equipment) return setError(t('exercises.form.equipmentRequired'));

    setSaving(true);
    setError(null);
    try {
      await createCustomExercise({ name, muscleGroup, equipment });
      router.back();
    } catch (e) {
      setError(
        e instanceof DuplicateExerciseError
          ? t('exercises.form.duplicate', { name: e.existing.name })
          : t('exercises.form.saveError'),
      );
      setSaving(false);
    }
  }

  return (
    <Screen>
      <Card>
        <TextField
          label={t('exercises.form.name')}
          value={name}
          onChangeText={setName}
          placeholder={t('exercises.form.namePlaceholder')}
          maxLength={EXERCISE_NAME_MAX_LENGTH}
          autoFocus={!name}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </Card>

      <Card title={t('exercises.form.muscleGroup')}>
        <View style={styles.chips}>
          {MUSCLE_GROUPS.map((muscle) => (
            <Chip
              key={muscle}
              label={t(`muscleGroups.${muscle}`)}
              selected={muscleGroup === muscle}
              onPress={() => setMuscleGroup(muscle)}
            />
          ))}
        </View>
      </Card>

      <Card title={t('exercises.form.equipment')}>
        <View style={styles.chips}>
          {EQUIPMENT.map((item) => (
            <Chip
              key={item}
              label={t(`equipment.${item}`)}
              selected={equipment === item}
              onPress={() => setEquipment(item)}
            />
          ))}
        </View>
      </Card>

      {error ? (
        <Text accessibilityRole="alert" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}

      <Button title={t('exercises.form.save')} onPress={save} disabled={saving} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  error: { fontSize: 15, textAlign: 'center' },
});
