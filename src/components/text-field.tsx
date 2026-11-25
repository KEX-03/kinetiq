import { StyleSheet, Text, TextInput, useColorScheme, View, type TextInputProps } from 'react-native';

type TextFieldProps = TextInputProps & {
  label?: string;
};

export function TextField({ label, style, ...rest }: TextFieldProps) {
  const dark = useColorScheme() === 'dark';

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={dark ? '#8E8E93' : '#A0A0A5'}
        style={[styles.input, dark && styles.inputDark, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: '#6C6C70' },
  labelDark: { color: '#AEAEB2' },
  input: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 17,
    color: '#000',
    backgroundColor: 'rgba(120,120,128,0.12)',
  },
  inputDark: { color: '#fff', backgroundColor: 'rgba(120,120,128,0.24)' },
});
