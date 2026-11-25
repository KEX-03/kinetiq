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
};

export type ThemeColors = typeof light;

/** Colors for the current color scheme (follows the theme chosen in Settings). */
export function useThemeColors(): ThemeColors {
  return useColorScheme() === 'dark' ? dark : light;
}
