import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from './theme';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const colors = useThemeColors();

  return (
    <View accessibilityRole="radiogroup" style={[styles.track, { backgroundColor: colors.fill }]}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.segment, selected && { backgroundColor: colors.tint }]}>
            <Text style={[styles.label, { color: selected ? colors.onTint : colors.text }]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', borderRadius: 12, borderCurve: 'continuous', padding: 3 },
  segment: {
    flex: 1,
    minHeight: 48,
    borderRadius: 10,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 16, fontWeight: '600' },
});
