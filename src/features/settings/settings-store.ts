import { getLocales } from 'expo-localization';
import { Appearance } from 'react-native';

import { db, newId } from '@/db/client';
import { isWeightUnit, type WeightUnit } from '@/utils/units';

export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export type Settings = {
  weightUnit: WeightUnit;
  restSeconds: number;
  theme: ThemePreference;
};

export const REST_SECONDS_MIN = 15;
export const REST_SECONDS_MAX = 600;
export const REST_SECONDS_STEP = 15;

/** Column value in the settings table for each setting. */
const KEYS: Record<keyof Settings, string> = {
  weightUnit: 'weight_unit',
  restSeconds: 'rest_seconds',
  theme: 'theme',
};

/** Defaults before the user changes anything. US locales start in lb, everyone else in kg. */
export function defaultSettings(): Settings {
  const usesPounds = getLocales()[0]?.measurementSystem === 'us';
  return { weightUnit: usesPounds ? 'lb' : 'kg', restSeconds: 90, theme: 'system' };
}

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference);
}

function parseRestSeconds(value: string): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n >= REST_SECONDS_MIN && n <= REST_SECONDS_MAX ? n : null;
}

/** Reads all settings, falling back to defaults for missing or invalid values. */
export async function loadSettings(): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>(
    'SELECT key, value FROM settings WHERE deleted = 0',
  );
  const stored = new Map(rows.map((row) => [row.key, row.value]));
  const settings = defaultSettings();

  const unit = stored.get(KEYS.weightUnit);
  if (isWeightUnit(unit)) settings.weightUnit = unit;

  const rest = stored.get(KEYS.restSeconds);
  const restSeconds = rest === undefined ? null : parseRestSeconds(rest);
  if (restSeconds !== null) settings.restSeconds = restSeconds;

  const theme = stored.get(KEYS.theme);
  if (isThemePreference(theme)) settings.theme = theme;

  return settings;
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (id, key, value, updated_at, deleted)
     VALUES (?, ?, ?, ?, 0)
     ON CONFLICT(key) DO UPDATE SET
       value = excluded.value,
       updated_at = excluded.updated_at,
       deleted = 0`,
    newId(),
    KEYS[key],
    String(value),
    Date.now(),
  );
}

/** Makes useColorScheme() across the app follow the chosen theme. */
export function applyTheme(theme: ThemePreference): void {
  Appearance.setColorScheme(theme === 'system' ? 'auto' : theme);
}
