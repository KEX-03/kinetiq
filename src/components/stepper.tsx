import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from './theme';

type StepperProps = {
  /** Already formatted for display, e.g. "1:30" or "62.5". */
  label: string;
  onDecrement: () => void;
  onIncrement: () => void;
  decrementLabel: string;
  incrementLabel: string;
  canDecrement?: boolean;
  canIncrement?: boolean;
};

export function Stepper({
  label,
  onDecrement,
  onIncrement,
  decrementLabel,
  incrementLabel,
  canDecrement = true,
  canIncrement = true,
}: StepperProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.row}>
      <StepButton
        symbol="−"
        accessibilityLabel={decrementLabel}
        disabled={!canDecrement}
        onPress={onDecrement}
      />
      <Text style={[styles.value, { color: colors.text }]} accessibilityLiveRegion="polite">
        {label}
      </Text>
      <StepButton
        symbol="+"
        accessibilityLabel={incrementLabel}
        disabled={!canIncrement}
        onPress={onIncrement}
      />
    </View>
  );
}

type StepButtonProps = {
  symbol: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
};

function StepButton({ symbol, accessibilityLabel, disabled, onPress }: StepButtonProps) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.fill },
        (pressed || disabled) && styles.dimmed,
      ]}>
      <Text style={[styles.symbol, { color: colors.tint }]}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  value: { flex: 1, fontSize: 28, fontWeight: '700', textAlign: 'center', fontVariant: ['tabular-nums'] },
  button: {
    width: 64,
    height: 56,
    borderRadius: 14,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: { fontSize: 28, fontWeight: '600' },
  dimmed: { opacity: 0.4 },
});
