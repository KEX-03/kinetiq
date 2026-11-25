import type { ReactNode } from 'react';
import { StyleSheet, Text, useColorScheme, View, type ViewProps } from 'react-native';

type CardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
};

export function Card({ title, subtitle, children, style, ...rest }: CardProps) {
  const dark = useColorScheme() === 'dark';

  return (
    <View style={[styles.card, dark && styles.cardDark, style]} {...rest}>
      {title ? <Text style={[styles.title, dark && styles.textDark]}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  cardDark: { backgroundColor: '#1C1C1E', boxShadow: 'none' },
  title: { fontSize: 20, fontWeight: '700', color: '#000' },
  textDark: { color: '#fff' },
  subtitle: { fontSize: 15, color: '#8E8E93' },
});
