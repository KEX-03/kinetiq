import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { useThemeColors } from './theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary' | 'destructive';
};

export function Button({ title, variant = 'primary', style, disabled, ...rest }: ButtonProps) {
  const colors = useThemeColors();
  const background = variant === 'primary' ? colors.tint : colors.fill;
  const labelColor =
    variant === 'primary' ? colors.onTint : variant === 'destructive' ? colors.danger : colors.tint;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      style={(state) => [
        styles.base,
        { backgroundColor: background },
        (state.pressed || disabled) && styles.dimmed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Text style={[styles.label, { color: labelColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dimmed: { opacity: 0.6 },
  label: { fontSize: 17, fontWeight: '600' },
});
