import type { SQLiteDatabase } from 'expo-sqlite';

import type { Equipment, MuscleGroup } from '@/features/exercises/exercise-store';

/**
 * Built-in exercises. IDs are fixed (not generated per install) so the same exercise has
 * the same ID on every device: needed for future sync, and lets names be translated by ID.
 * Never change an existing ID. To add an exercise, append a row with a new UUID.
 */
const DEFAULT_EXERCISES: readonly [id: string, name: string, muscleGroup: MuscleGroup, equipment: Equipment][] = [
  // chest
  ['10c5d700-493f-4bb7-996b-f750fcdb4184', 'Barbell Bench Press', 'chest', 'barbell'],
  ['2201fa49-f1c3-4182-8b3a-01a25f737cfc', 'Incline Barbell Bench Press', 'chest', 'barbell'],
  ['1d12da3f-220b-4e85-8002-687f4291a2f1', 'Dumbbell Bench Press', 'chest', 'dumbbell'],
  ['6f86e7d3-786a-4d85-b877-bc6ec3d74da4', 'Incline Dumbbell Press', 'chest', 'dumbbell'],
  ['8c21973a-1600-48d2-9bf4-11cb5f9e85ed', 'Dumbbell Fly', 'chest', 'dumbbell'],
  ['1a88da5b-5d88-4df4-a271-185ae12e213e', 'Machine Chest Press', 'chest', 'machine'],
  ['db1bdd2e-087d-46c4-8381-9b24e0ef953e', 'Cable Crossover', 'chest', 'cable'],
  ['721041a6-d195-4a83-9272-da5b7ff998ba', 'Push-up', 'chest', 'bodyweight'],
  // back
  ['0185dd83-8e6d-4f80-92c2-bf3bb67ff70b', 'Deadlift', 'back', 'barbell'],
  ['c85ef0e1-1b01-4429-95d6-1ce0d37ec9e2', 'Barbell Row', 'back', 'barbell'],
  ['a86fb586-c87e-4d37-834f-d74cc578c2f8', 'Pull-up', 'back', 'bodyweight'],
  ['1a4149f9-a718-43d2-820e-ca2b37d0b42b', 'Chin-up', 'back', 'bodyweight'],
  ['71943bf7-2881-4523-a91b-474deada944c', 'Lat Pulldown', 'back', 'cable'],
  ['90225ede-8289-4dd7-92aa-4f1251f6be79', 'Seated Cable Row', 'back', 'cable'],
  ['6a07052d-301b-4159-a6b2-e30754ce8631', 'One-Arm Dumbbell Row', 'back', 'dumbbell'],
  ['eb98ee0b-9b4d-42cf-ae35-ee75787d93ee', 'Machine Row', 'back', 'machine'],
  // shoulders
  ['2aac3a05-4a0c-409b-9a22-e4cfa02fed0c', 'Overhead Press', 'shoulders', 'barbell'],
  ['e5e317a2-b320-4005-96bc-5515efc54e68', 'Seated Dumbbell Shoulder Press', 'shoulders', 'dumbbell'],
  ['bff83a12-6d05-479b-a549-0effd0020a66', 'Dumbbell Lateral Raise', 'shoulders', 'dumbbell'],
  ['3c40fc7e-d614-43d8-941c-1b1d3883f1d9', 'Cable Lateral Raise', 'shoulders', 'cable'],
  ['76738457-f411-4e33-a22d-f24811ae2722', 'Face Pull', 'shoulders', 'cable'],
  ['fb4a3200-f19c-4fc1-8e53-fc84df863221', 'Reverse Pec Deck', 'shoulders', 'machine'],
  ['7e08e062-18eb-499e-b8a2-300ac6fe678c', 'Machine Shoulder Press', 'shoulders', 'machine'],
  // biceps
  ['6e0a6eb8-5241-49e9-9b84-5d5d87e1de49', 'Barbell Curl', 'biceps', 'barbell'],
  ['94cbdd4d-76aa-48a9-aa2d-f2a1b3b580a9', 'Dumbbell Curl', 'biceps', 'dumbbell'],
  ['e082f323-28b6-47c8-85d8-7593d007642f', 'Hammer Curl', 'biceps', 'dumbbell'],
  ['a6bb74dd-ead4-45c1-990a-28f16e70a593', 'Cable Curl', 'biceps', 'cable'],
  ['b928730c-dc61-4b4a-8423-2a38059dbc39', 'Machine Preacher Curl', 'biceps', 'machine'],
  // triceps
  ['dde1af43-4bb6-48c4-ab62-d9138bb629a7', 'Close-Grip Bench Press', 'triceps', 'barbell'],
  ['1d17490c-997c-4f15-9376-cca027c09428', 'Skull Crusher', 'triceps', 'barbell'],
  ['d30bd807-95d0-4ea3-a9ea-25c34085861c', 'Triceps Pushdown', 'triceps', 'cable'],
  ['f16e2f1d-eda1-46d7-a786-5da26a7b66bd', 'Overhead Cable Triceps Extension', 'triceps', 'cable'],
  ['ff8c06f7-6ae8-4dda-8e92-877b0e003754', 'Dumbbell Overhead Triceps Extension', 'triceps', 'dumbbell'],
  ['c6c8d8d2-a102-4521-a890-ab23f425e253', 'Dip', 'triceps', 'bodyweight'],
  // quads
  ['4375a95f-eb17-4d8e-90d0-f68ccdf340f8', 'Back Squat', 'quads', 'barbell'],
  ['289c6191-03ad-436d-a912-5c2d2051fd34', 'Front Squat', 'quads', 'barbell'],
  ['073c2f87-a8fe-4991-80a1-684a9d7cccf2', 'Leg Press', 'quads', 'machine'],
  ['fd722ffb-b6ed-4d99-b391-f0892c2df570', 'Hack Squat', 'quads', 'machine'],
  ['15b44d8b-cd21-4571-b186-0b1dfc10fe84', 'Leg Extension', 'quads', 'machine'],
  ['e9bf8fbd-d30c-4b64-835b-76f1d91b7fcf', 'Bulgarian Split Squat', 'quads', 'dumbbell'],
  ['88ca1616-1441-46c9-817e-d6456253a3f2', 'Goblet Squat', 'quads', 'dumbbell'],
  // hamstrings
  ['9fdc10eb-4009-4bf0-a289-f322b1f2da31', 'Romanian Deadlift', 'hamstrings', 'barbell'],
  ['f242e7ae-66e9-4969-9e6e-fc3c262a7611', 'Dumbbell Romanian Deadlift', 'hamstrings', 'dumbbell'],
  ['33e3753e-5ace-4ae0-a987-4ee5fed5e8f5', 'Lying Leg Curl', 'hamstrings', 'machine'],
  ['3d2de76a-e86b-47e0-8d68-96feeb6f51bf', 'Seated Leg Curl', 'hamstrings', 'machine'],
  // glutes
  ['9a7e9179-af5c-4772-8cb5-1081f14600e8', 'Barbell Hip Thrust', 'glutes', 'barbell'],
  ['cb72c601-1eef-4f59-8020-dd404051cf89', 'Walking Lunge', 'glutes', 'dumbbell'],
  ['5c875730-6d46-4c61-97e1-9963b7dc9d33', 'Cable Glute Kickback', 'glutes', 'cable'],
  ['bc4df181-2493-417e-97c2-a347ba640cf0', 'Hip Abduction Machine', 'glutes', 'machine'],
  ['ade4c45b-3e25-4bf7-bf47-ac44bb99ca03', 'Glute Bridge', 'glutes', 'bodyweight'],
  // calves
  ['97f05472-87b8-41d3-9657-3d6a1a1f9118', 'Standing Calf Raise', 'calves', 'machine'],
  ['fd64c9ce-9d92-43fe-b8dc-934a3ed6df43', 'Seated Calf Raise', 'calves', 'machine'],
  // core
  ['249af066-02b1-4c0e-825f-9ee0e5910999', 'Crunch', 'core', 'bodyweight'],
  ['679252ee-96b1-4c8c-a9d1-80dd50c90ef5', 'Hanging Leg Raise', 'core', 'bodyweight'],
  ['99bcec84-3264-49d9-9c7d-c6483a114c9f', 'Ab Wheel Rollout', 'core', 'bodyweight'],
  ['6b0af7b7-92bc-4767-9f16-c554056681b0', 'Cable Crunch', 'core', 'cable'],
];

/** Inserts the built-in exercises if the exercises table is empty. */
export async function seedExercisesIfEmpty(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM exercises');
  if ((row?.count ?? 0) > 0) return;

  const now = Date.now();
  await db.withExclusiveTransactionAsync(async (txn) => {
    const insert = await txn.prepareAsync(
      `INSERT OR IGNORE INTO exercises (id, name, muscle_group, equipment, is_custom, updated_at, deleted)
       VALUES (?, ?, ?, ?, 0, ?, 0)`,
    );
    try {
      for (const [id, name, muscleGroup, equipment] of DEFAULT_EXERCISES) {
        await insert.executeAsync(id, name, muscleGroup, equipment, now);
      }
    } finally {
      await insert.finalizeAsync();
    }
  });
}
