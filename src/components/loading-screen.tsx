import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from './theme';

type LoadingScreenProps = {
  message?: string;
  /** Shown instead of the spinner when something went wrong. */
  error?: string;
};

export function LoadingScreen({ message, error }: LoadingScreenProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {error ? null : <ActivityIndicator size="large" color={colors.tint} />}
      {message ? <Text style={[styles.message, { color: colors.text }]}>{message}</Text> : null}
      {error ? (
        <Text selectable style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  message: { fontSize: 17, textAlign: 'center' },
  error: { fontSize: 15, textAlign: 'center' },
});
