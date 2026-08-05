import {
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/common/button";
import { colors, spacing } from "@/theme/tokens";

type ErrorStateProps = {
  message?: string;
  onRetry?: () => void;
};

export function ErrorState({
  message = "문제가 발생했습니다.",
  onRetry,
}: ErrorStateProps) {
  return (
    <View
      accessibilityRole="alert"
      style={styles.container}
    >
      <Text style={styles.title}>오류</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry ? (
        <Button
          title="다시 시도"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },
  title: {
    color: colors.error,
    fontSize: 20,
    fontWeight: "700",
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
});