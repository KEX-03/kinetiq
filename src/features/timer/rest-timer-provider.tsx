import Storage from 'expo-sqlite/kv-store';
import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { playRestAlert, prepareRestAlert, releaseRestAlert } from './rest-alert';
import { cancelRestEnd, scheduleRestEnd, setUpNotificationChannel } from './rest-notifications';

export type RestTimer = {
  /** When rest ends (ms since epoch). The countdown is always derived from this. */
  endsAt: number;
  /** Total rest length including +/− adjustments, for the progress bar. */
  durationMs: number;
  /** Scheduled "rest over" notification, if notifications are allowed. */
  notificationId: string | null;
};

type RestTimerContextValue = {
  timer: RestTimer | null;
  startRest: (seconds: number) => void;
  /** Adds or removes time; removing past zero ends the rest. */
  adjustRest: (deltaSeconds: number) => void;
  skipRest: () => void;
};

/** Device-local (never synced) so a running timer survives the app being closed. */
const STORAGE_KEY = 'restTimer';
/** If the app only notices rest ended this late (it was in the background), skip the beep. */
const LATE_ALERT_MS = 2000;
/** Removing time that would leave less than this ends the rest instead. */
const MIN_REMAINING_MS = 1000;

function loadPersisted(): RestTimer | null {
  try {
    const raw = Storage.getItemSync(STORAGE_KEY);
    if (!raw) return null;
    const timer = JSON.parse(raw) as RestTimer;
    return timer.endsAt > Date.now() ? timer : null;
  } catch {
    return null;
  }
}

function persist(timer: RestTimer | null) {
  try {
    if (timer) Storage.setItemSync(STORAGE_KEY, JSON.stringify(timer));
    else Storage.removeItemSync(STORAGE_KEY);
  } catch {
    // Losing the persisted timer only matters if the app is killed mid-rest.
  }
}

const RestTimerContext = createContext<RestTimerContextValue | null>(null);

export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [timer, setTimer] = useState<RestTimer | null>(loadPersisted);
  const timerRef = useRef(timer);
  // Notification calls are async; running them one at a time keeps ids from getting mixed up.
  const queue = useRef<Promise<void>>(Promise.resolve());

  function commit(next: RestTimer | null) {
    timerRef.current = next;
    setTimer(next);
    persist(next);
  }

  function enqueue(task: () => Promise<void>) {
    queue.current = queue.current.then(task).catch((error: unknown) => {
      console.warn('Rest timer update failed', error);
    });
  }

  /** Shows the new end time right away, then schedules its notification. */
  async function runUntil(endsAt: number, durationMs: number) {
    await cancelRestEnd(timerRef.current?.notificationId);
    commit({ endsAt, durationMs, notificationId: null });
    const notificationId = await scheduleRestEnd(endsAt);
    if (timerRef.current?.endsAt === endsAt) {
      commit({ endsAt, durationMs, notificationId });
    } else {
      await cancelRestEnd(notificationId); // changed again while scheduling
    }
  }

  function startRest(seconds: number) {
    enqueue(() => runUntil(Date.now() + seconds * 1000, seconds * 1000));
  }

  function adjustRest(deltaSeconds: number) {
    enqueue(async () => {
      const current = timerRef.current;
      if (!current) return;
      const endsAt = current.endsAt + deltaSeconds * 1000;
      if (endsAt - Date.now() < MIN_REMAINING_MS) {
        await cancelRestEnd(current.notificationId);
        commit(null);
        return;
      }
      await runUntil(endsAt, Math.max(current.durationMs + deltaSeconds * 1000, endsAt - Date.now()));
    });
  }

  function skipRest() {
    enqueue(async () => {
      await cancelRestEnd(timerRef.current?.notificationId);
      commit(null);
    });
  }

  // One-time setup: Android channel and preloaded beep.
  useEffect(() => {
    setUpNotificationChannel().catch(() => {});
    prepareRestAlert();
    return releaseRestAlert;
  }, []);

  // Fire the in-app alert when rest ends. The notification covers the locked-phone case.
  const endsAt = timer?.endsAt;
  useEffect(() => {
    if (endsAt === undefined) return;
    const timeout = setTimeout(() => {
      const onTime = Date.now() - endsAt < LATE_ALERT_MS;
      if (onTime && AppState.currentState === 'active') playRestAlert();
      enqueue(async () => {
        if (timerRef.current?.endsAt === endsAt) commit(null);
      });
    }, Math.max(0, endsAt - Date.now()));
    return () => clearTimeout(timeout);
  }, [endsAt]);

  return (
    <RestTimerContext value={{ timer, startRest, adjustRest, skipRest }}>{children}</RestTimerContext>
  );
}

export function useRestTimer(): RestTimerContextValue {
  const value = use(RestTimerContext);
  if (!value) throw new Error('useRestTimer must be used inside RestTimerProvider');
  return value;
}
