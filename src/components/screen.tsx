import type { ReactNode } from 'react';
import { Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useThemeColors } from './theme';

/**
 * iOS insets scroll content automatically (contentInsetAdjustmentBehavior). Android needs an
 * explicit top inset; SafeAreaView only pads where the view actually overlaps the status bar,
 * so screens with a header get no extra space.
 */
export const ANDROID_TOP_EDGES: Edge[] = Platform.OS === 'android' ? ['top'] : [];

/** Scrollable screen body with the app background and standard padding. */
export function Screen({ children }: { children: ReactNode }) {
  const colors = useThemeColors();

  return (
    <SafeAreaView edges={ANDROID_TOP_EDGES} style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustKeyboardInsets
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        contentContainerStyle={styles.content}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 16 },
});
