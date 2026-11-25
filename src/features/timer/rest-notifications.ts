import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

import i18n from '@/i18n';

const CHANNEL_ID = 'rest-timer';

/**
 * Show rest-timer alerts even while the app is open. The system sound is off in the
 * foreground because the app plays its own beep then (see rest-alert.ts).
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Android needs a channel before notifications can show. Safe to call repeatedly. */
export async function setUpNotificationChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t('timer.channelName'),
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 150, 250],
    sound: 'default',
  });
}

/** Asks for permission the first time only. Returns whether notifications are allowed. */
async function ensurePermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** Schedules the "rest over" alert. Returns its id, or null if notifications aren't allowed. */
export async function scheduleRestEnd(endsAt: number): Promise<string | null> {
  if (!(await ensurePermission())) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('timer.notificationTitle'),
      body: i18n.t('timer.notificationBody'),
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endsAt,
      channelId: CHANNEL_ID,
    },
  });
}

export async function cancelRestEnd(notificationId: string | null | undefined): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
