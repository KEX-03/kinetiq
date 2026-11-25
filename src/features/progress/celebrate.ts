import * as Haptics from 'expo-haptics';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const safe = (haptic: Promise<void>) => haptic.catch(() => {});

/** A stronger, distinct haptic for breaking a personal record. */
export async function celebratePr(): Promise<void> {
  safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  await wait(150);
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  await wait(100);
  safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
}
