import Storage from 'expo-sqlite/kv-store';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Alert, Platform } from 'react-native';

import i18n from '@/i18n';

const CHANNEL_ID = 'rest-timer';
/** Device-local flag so the exact-alarm explanation is shown only once. */
const EXACT_ALARM_ASKED_KEY = 'exactAlarmAsked';

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

/**
 * Android 12+ delays scheduled notifications by minutes unless the user allows exact alarms
 * (off by default on Android 14+). Returns true when the user could turn it on but hasn't.
 * Always false on iOS, and where the permission isn't declared (e.g. Expo Go).
 */
export async function canImproveRestAlerts(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const status = await Notifications.getExactAlarmPermissionsAsync();
    return !status.granted && status.canAskAgain;
  } catch {
    return false;
  }
}

/** Opens the system screen where the user allows exact alarms. Resolves when they return. */
export async function allowExactRestAlerts(): Promise<void> {
  try {
    await Notifications.requestExactAlarmPermissionsAsync();
  } catch (error) {
    console.warn('Could not open exact alarm settings', error);
  }
}

/** The first time a rest starts without exact alarms, explains why and offers to fix it. */
async function explainExactAlarmsOnce(): Promise<void> {
  if (!(await canImproveRestAlerts())) return;
  try {
    if (Storage.getItemSync(EXACT_ALARM_ASKED_KEY)) return;
    Storage.setItemSync(EXACT_ALARM_ASKED_KEY, '1');
  } catch {
    return; // without the flag we'd ask every time, so don't ask at all
  }
  Alert.alert(i18n.t('timer.exactTitle'), i18n.t('timer.exactMessage'), [
    { text: i18n.t('timer.exactLater'), style: 'cancel' },
    { text: i18n.t('timer.exactAllow'), onPress: () => void allowExactRestAlerts() },
  ]);
}

/** Schedules the "rest over" alert. Returns its id, or null if notifications aren't allowed. */
export async function scheduleRestEnd(endsAt: number): Promise<string | null> {
  if (!(await ensurePermission())) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('timer.notificationTitle'),
      body: i18n.t('timer.notificationBody'),
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: endsAt,
      channelId: CHANNEL_ID,
      // Alarm-clock alarms are never deferred for battery saving (falls back if not allowed).
      delivery: 'alarmClock',
    },
  });
  void explainExactAlarmsOnce();
  return id;
}

export async function cancelRestEnd(notificationId: string | null | undefined): Promise<void> {
  if (!notificationId) return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
