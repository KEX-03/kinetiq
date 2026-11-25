import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

type ButtonProps = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'secondary';
};

export function Button({ title, variant = 'primary', style, ...rest }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={(state) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      <Text style={[styles.label, variant === 'primary' ? styles.primaryLabel : styles.secondaryLabel]}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: '#208AEF' },
  secondary: { backgroundColor: 'rgba(120,120,128,0.16)' },
  pressed: { opacity: 0.7 },
  label: { fontSize: 17, fontWeight: '600' },
  primaryLabel: { color: '#fff' },
  secondaryLabel: { color: '#208AEF' },
});
