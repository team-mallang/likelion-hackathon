import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, spacing } from "@/theme/tokens";

type LoadingStateProps = {
  message?: string;
};

export function LoadingState({
  message = "불러오는 중입니다.",
}: LoadingStateProps) {
  return (
    <View
      accessibilityLabel={message}
      accessibilityRole="progressbar"
      style={styles.container}
    >
      <ActivityIndicator
        color={colors.primary}
        size="large"
      />

      <Text style={styles.message}>{message}</Text>
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
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: "center",
  },
});