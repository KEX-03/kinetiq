import { router } from 'expo-router';

import { ExercisePicker } from '@/features/exercises/exercise-picker';

/** Exercise library: find any exercise and open its progress. */
export default function ProgressScreen() {
  return (
    <ExercisePicker
      onSelect={(exercise) => router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } })}
      onCreate={({ name, muscleGroup }) =>
        router.push({ pathname: '/exercise/new', params: { name, muscleGroup: muscleGroup ?? '' } })
      }
    />
  );
}
