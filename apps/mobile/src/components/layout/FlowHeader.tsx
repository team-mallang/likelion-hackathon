import { useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { colors, spacing } from "@/theme/tokens";

type FlowHeaderProps = {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
};

export function FlowHeader({
  title,
  showBack = true,
  onBack,
}: FlowHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
      return;
    }

    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.side}>
        {showBack ? (
          <Pressable
            accessibilityLabel="이전 화면으로 이동"
            accessibilityRole="button"
            hitSlop={12}
            onPress={handleBack}
          >
            <Text style={styles.back}>←</Text>
          </Pressable>
        ) : null}
      </View>

      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={styles.side} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
  },
  side: {
    width: 48,
  },
  back: {
    color: colors.primary,
    fontSize: 24,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
});
