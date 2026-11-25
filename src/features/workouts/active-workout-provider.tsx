import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import * as store from './workout-store';
import type { ActiveWorkout } from './workout-store';

const KEEP_AWAKE_TAG = 'active-workout';

type ActiveWorkoutContextValue = {
  activeWorkout: ActiveWorkout | null;
  /** Starts a new workout (or returns the one in progress) and returns it. */
  startWorkout: () => Promise<ActiveWorkout>;
  /** Re-reads the active workout from the database, e.g. after finishing or discarding. */
  refreshActiveWorkout: () => Promise<void>;
};

const ActiveWorkoutContext = createContext<ActiveWorkoutContextValue | null>(null);

type ActiveWorkoutProviderProps = {
  initialActiveWorkout: ActiveWorkout | null;
  children: ReactNode;
};

/** Tracks the workout in progress app-wide and keeps the screen awake while there is one. */
export function ActiveWorkoutProvider({ initialActiveWorkout, children }: ActiveWorkoutProviderProps) {
  const [activeWorkout, setActiveWorkout] = useState(initialActiveWorkout);
  const activeId = activeWorkout?.id ?? null;

  useEffect(() => {
    if (!activeId) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {
      // Not supported on this device; the workout still works, the screen may just dim.
    });
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {});
    };
  }, [activeId]);

  async function startWorkout() {
    const workout = await store.startWorkout();
    setActiveWorkout(workout);
    return workout;
  }

  async function refreshActiveWorkout() {
    setActiveWorkout(await store.getActiveWorkout());
  }

  return (
    <ActiveWorkoutContext value={{ activeWorkout, startWorkout, refreshActiveWorkout }}>
      {children}
    </ActiveWorkoutContext>
  );
}

export function useActiveWorkout(): ActiveWorkoutContextValue {
  const value = use(ActiveWorkoutContext);
  if (!value) throw new Error('useActiveWorkout must be used inside ActiveWorkoutProvider');
  return value;
}
