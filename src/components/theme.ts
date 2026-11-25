import { useColorScheme } from 'react-native';

const light = {
  background: '#F2F2F7',
  card: '#FFFFFF',
  text: '#000000',
  textSecondary: '#6C6C70',
  tint: '#208AEF',
  onTint: '#FFFFFF',
  fill: 'rgba(120,120,128,0.16)',
  danger: '#FF3B30',
  /** Personal-record highlights. */
  pr: '#C98A00',
  prFill: 'rgba(255,184,0,0.18)',
};

const dark: typeof light = {
  background: '#000000',
  card: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  tint: '#3A9BFF',
  onTint: '#FFFFFF',
  fill: 'rgba(120,120,128,0.32)',
  danger: '#FF453A',
  pr: '#FFC933',
  prFill: 'rgba(255,201,51,0.18)',
};

/**
 * Raised surfaces such as modal sheets. In dark mode iOS lightens these so they stand out
 * from the black screen behind; in light mode the dimmed backdrop already does that.
 */
const darkElevated: typeof light = {
  ...dark,
  background: '#1C1C1E',
  card: '#2C2C2E',
};

export type ThemeColors = typeof light;

/** Colors for the current color scheme (follows the theme chosen in Settings). */
export function useThemeColors({ elevated = false }: { elevated?: boolean } = {}): ThemeColors {
  if (useColorScheme() !== 'dark') return light;
  return elevated ? darkElevated : dark;
}
