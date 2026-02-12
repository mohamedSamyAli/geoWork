import { StyleSheet, TextInput, View, TextInputProps } from 'react-native';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

export type ThemedInputProps = TextInputProps & {
  label?: string;
  error?: string;
};

export function ThemedInput({ label, error, style, ...rest }: ThemedInputProps) {
  return (
    <View style={styles.container}>
      {label && (
        <ThemedText type="defaultSemiBold" style={styles.label}>
          {label}
        </ThemedText>
      )}
      <TextInput
        style={[
          styles.input,
          style,
        ]}
        placeholderTextColor="#9ca3af"
        {...rest}
      />
      {error && (
        <ThemedText style={[styles.error, { color: '#ef4444' }]}>
          {error}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
  },
  error: {
    marginTop: 4,
    fontSize: 12,
  },
});
