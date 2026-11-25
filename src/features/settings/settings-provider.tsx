import { createContext, use, useState, type ReactNode } from 'react';

import { applyTheme, loadSettings, saveSetting, type Settings } from './settings-store';

type SettingsContextValue = {
  settings: Settings;
  /** Saves to the database first, then updates the UI. Throws if the write fails. */
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  /** Re-reads every setting from the database (e.g. after a data reset). */
  reloadSettings: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

type SettingsProviderProps = {
  /** Settings already loaded from the database before first render. */
  initialSettings: Settings;
  children: ReactNode;
};

export function SettingsProvider({ initialSettings, children }: SettingsProviderProps) {
  const [settings, setSettings] = useState(initialSettings);

  async function updateSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
    await saveSetting(key, value);
    if (key === 'theme') applyTheme(value as Settings['theme']);
    setSettings((current) => ({ ...current, [key]: value }));
  }

  async function reloadSettings() {
    const fresh = await loadSettings();
    applyTheme(fresh.theme);
    setSettings(fresh);
  }

  return (
    <SettingsContext value={{ settings, updateSetting, reloadSettings }}>{children}</SettingsContext>
  );
}

export function useSettings(): SettingsContextValue {
  const value = use(SettingsContext);
  if (!value) throw new Error('useSettings must be used inside SettingsProvider');
  return value;
}
