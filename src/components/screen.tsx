import type { ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { useThemeColors } from './theme';

/** Scrollable screen body with the app background and standard padding. */
export function Screen({ children }: { children: ReactNode }) {
  const colors = useThemeColors();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.content}>
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
});
