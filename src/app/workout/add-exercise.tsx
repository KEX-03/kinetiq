import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { ExercisePicker } from '@/features/exercises/exercise-picker';
import { addExerciseToWorkout } from '@/features/workouts/workout-store';

/** Modal: pick an exercise to add to the workout in progress. */
export default function AddExerciseScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>();
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);

  return (
    <ExercisePicker
      title={t('workout.addExercise')}
      onSelect={async (exercise) => {
        if (adding) return;
        setAdding(true);
        try {
          await addExerciseToWorkout(workoutId, exercise.id);
          router.back();
        } catch (error) {
          Alert.alert(t('workout.saveError'), String(error));
          setAdding(false);
        }
      }}
      onCreate={({ name, muscleGroup }) =>
        router.push({ pathname: '/exercise/new', params: { name, muscleGroup: muscleGroup ?? '' } })
      }
    />
  );
}
