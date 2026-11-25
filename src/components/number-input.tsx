import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { parseDecimal } from '@/utils/units';

import { useThemeColors } from './theme';

type NumberInputProps = {
  /** Text in the field. Kept as a string so partial input like "62." isn't lost. */
  value: string;
  onChangeText: (text: string) => void;
  /** Amount the −/+ buttons change the value by. */
  step: number;
  min?: number;
  /** Shown under the field, e.g. "kg" or "Reps". Also used for accessibility. */
  label: string;
  decreaseLabel: string;
  increaseLabel: string;
  allowDecimals?: boolean;
};

/** Large numeric field with −/+ buttons, sized for use mid-workout. */
export function NumberInput({
  value,
  onChangeText,
  step,
  min = 0,
  label,
  decreaseLabel,
  increaseLabel,
  allowDecimals = false,
}: NumberInputProps) {
  const colors = useThemeColors();

  function bump(direction: 1 | -1) {
    const current = parseDecimal(value) ?? 0;
    const next = Math.max(min, current + direction * step);
    onChangeText(String(Number(next.toFixed(2))));
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StepButton symbol="−" label={decreaseLabel} onPress={() => bump(-1)} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={allowDecimals ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          accessibilityLabel={label}
          placeholder="0"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { color: colors.text, backgroundColor: colors.fill }]}
        />
        <StepButton symbol="+" label={increaseLabel} onPress={() => bump(1)} />
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function StepButton({ symbol, label, onPress }: { symbol: string; label: string; onPress: () => void }) {
  const colors = useThemeColors();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.fill },
        pressed && styles.pressed,
      ]}>
      <Text style={[styles.symbol, { color: colors.tint }]}>{symbol}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  input: {
    flex: 1,
    minWidth: 56,
    height: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  button: {
    width: 48,
    height: 52,
    borderRadius: 12,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.6 },
  symbol: { fontSize: 26, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '500', textAlign: 'center' },
});
