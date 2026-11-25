import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

let player: AudioPlayer | null = null;

/** Loads the beep ahead of time so it plays instantly. Mixes with music instead of pausing it. */
export function prepareRestAlert(): void {
  if (player) return;
  setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
  player = createAudioPlayer(require('@/assets/sounds/rest-done.wav'));
}

export function releaseRestAlert(): void {
  player?.remove();
  player = null;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Short beep plus a distinct haptic pattern, for when rest ends with the app open. */
export async function playRestAlert(): Promise<void> {
  if (player) {
    try {
      await player.seekTo(0);
      player.play();
    } catch {
      // Sound is a nice-to-have; the haptic still fires.
    }
  }
  const haptic = (fn: () => Promise<void>) => fn().catch(() => {});
  haptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  await wait(200);
  haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  await wait(200);
  haptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
}
