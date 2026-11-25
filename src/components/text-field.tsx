import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useThemeColors } from './theme';

type TextFieldProps = TextInputProps & {
  label?: string;
  /** Style for the wrapper around the label and input (e.g. flex: 1 in a row). */
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({ label, style, containerStyle, ...rest }: TextFieldProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textSecondary}
        style={[styles.input, { color: colors.text, backgroundColor: colors.fill }, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  input: {
    minHeight: 48,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 17,
  },
});
