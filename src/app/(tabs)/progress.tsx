import { router } from 'expo-router';

import { BodyWeightLink } from '@/features/bodyweight/body-weight-link';
import { ExercisePicker } from '@/features/exercises/exercise-picker';

/** Progress hub: body weight, plus every exercise's progress and PRs. */
export default function ProgressScreen() {
  return (
    <ExercisePicker
      listHeader={<BodyWeightLink />}
      onSelect={(exercise) => router.push({ pathname: '/exercise/[id]', params: { id: exercise.id } })}
      onCreate={({ name, muscleGroup }) =>
        router.push({ pathname: '/exercise/new', params: { name, muscleGroup: muscleGroup ?? '' } })
      }
    />
  );
}
