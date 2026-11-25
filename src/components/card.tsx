import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ViewProps } from 'react-native';

import { useThemeColors } from './theme';

type CardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
};

export function Card({ title, subtitle, children, style, ...rest }: CardProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, style]} {...rest}>
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      {subtitle ? (
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    gap: 12,
    borderRadius: 16,
    borderCurve: 'continuous',
  },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 15 },
});
