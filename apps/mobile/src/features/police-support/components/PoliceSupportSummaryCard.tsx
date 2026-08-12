import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

import type { PoliceSupportOverview } from "@/features/police-support/types/policeSupport";
import { colors, radius, spacing } from "@/theme/tokens";

type PoliceSupportSummaryCardProps = {
  overview: PoliceSupportOverview;
};

export function PoliceSupportSummaryCard({
  overview,
}: PoliceSupportSummaryCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Ionicons
          accessibilityElementsHidden
          color={colors.textSecondary}
          name="language-outline"
          size={18}
        />
        <Text style={styles.label}>경찰관에게 보여주세요</Text>
      </View>

      <Text accessibilityLanguage="ja" style={styles.japaneseScript}>
        {overview.presentationScript.ja}
      </Text>

      <View style={styles.divider} />

      <Text accessibilityLanguage="ko" style={styles.koreanScript}>
        “{overview.presentationScript.ko}”
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  japaneseScript: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    lineHeight: 34,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  koreanScript: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
});
