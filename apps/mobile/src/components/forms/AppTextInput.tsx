import {
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  type TextInputProps,
  View,
} from "react-native";

import { colors, radius, spacing } from "@/theme/tokens";

type AppTextInputProps = TextInputProps & {
  label: string;
  error?: string;
};

export function AppTextInput({
  label,
  error,
  style,
  ...inputProps
}: AppTextInputProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <NativeTextInput
        accessibilityLabel={inputProps.accessibilityLabel ?? label}
        placeholderTextColor={colors.textSecondary}
        style={[
          styles.input,
          error ? styles.inputError : undefined,
          style,
        ]}
        {...inputProps}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  input: {
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
});