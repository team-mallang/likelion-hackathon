import { Ionicons } from "@expo/vector-icons";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, radius, spacing } from "@/theme/tokens";
import {
  getPasswordValueFromDisplayChange,
  maskPasswordForDisplay,
} from "./passwordMasking";

type LastCharacterPasswordInputProps = {
  label: string;
  value: string;
  placeholder: string;
  visible: boolean;
  editable?: boolean;
  error?: string;
  autoComplete?: "current-password" | "new-password";
  textContentType?: "password" | "newPassword";
  onChangeText: (value: string) => void;
  onToggleVisibility: () => void;
};

export function LastCharacterPasswordInput({
  label,
  value,
  placeholder,
  visible,
  editable = true,
  error,
  autoComplete,
  textContentType,
  onChangeText,
  onToggleVisibility,
}: LastCharacterPasswordInputProps) {
  const displayedValue = maskPasswordForDisplay(value, visible);

  function handleChangeText(nextDisplayedValue: string) {
    onChangeText(
      getPasswordValueFromDisplayChange(
        value,
        displayedValue,
        nextDisplayedValue,
        visible,
      ),
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          autoComplete={autoComplete}
          autoCorrect={false}
          editable={editable}
          maxLength={72}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          selection={{ start: displayedValue.length, end: displayedValue.length }}
          style={styles.input}
          textContentType={textContentType}
          value={displayedValue}
        />
        <Pressable
          accessibilityLabel={visible ? `${label} 숨기기` : `${label} 보기`}
          accessibilityRole="button"
          accessibilityState={{ disabled: !editable }}
          disabled={!editable}
          hitSlop={10}
          onPress={onToggleVisibility}
          style={({ pressed }) => [
            styles.visibilityButton,
            pressed && editable && styles.pressed,
            !editable && styles.disabled,
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.textSecondary}
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
          />
        </Pressable>
      </View>
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
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
    fontWeight: "700",
  },
  inputRow: {
    minHeight: 52,
    alignItems: "center",
    flexDirection: "row",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    minWidth: 0,
    minHeight: 52,
    flex: 1,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: 15,
  },
  visibilityButton: {
    width: 48,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    color: colors.error,
    fontSize: 13,
  },
  pressed: {
    opacity: 0.7,
  },
  disabled: {
    opacity: 0.45,
  },
});
