import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ProgressBar } from "@/components/layout/ProgressBar";
import { colors, radius, spacing } from "@/theme/tokens";

type CaseStatusCardProps = {
  caseNumber: string;
  reportStatusLabel: string;
  progressPercent: number;
  copyFeedbackVisible: boolean;
  onCopyCaseNumber: () => void;
  onOpenCaseGuide: () => void;
};

export function CaseStatusCard({
  caseNumber,
  reportStatusLabel,
  progressPercent,
  copyFeedbackVisible,
  onCopyCaseNumber,
  onOpenCaseGuide,
}: CaseStatusCardProps) {
  const normalizedProgress = Math.min(Math.max(progressPercent, 0), 100);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.caseNumberArea}>
          <Text style={styles.eyebrow}>사건 번호</Text>
          <Pressable
            accessibilityLabel={
              copyFeedbackVisible
                ? "사건번호 복사됨"
                : `사건번호 ${caseNumber} 복사`
            }
            accessibilityRole="button"
            focusable
            onPress={onCopyCaseNumber}
            style={styles.caseNumberButton}
          >
            <Text selectable style={styles.caseNumber}>
              {caseNumber}
            </Text>
            {copyFeedbackVisible ? (
              <Text
                accessibilityLiveRegion="polite"
                style={styles.copyLabel}
              >
                복사됨
              </Text>
            ) : (
              <Ionicons
                accessibilityElementsHidden
                color={colors.primary}
                name="copy-outline"
                size={20}
              />
            )}
          </Pressable>
        </View>

        <View style={styles.statusBadge}>
          <Text style={styles.statusLabel}>{reportStatusLabel}</Text>
        </View>
      </View>

      <Pressable
        accessibilityLabel="해당 사건 가이드 확인하기"
        accessibilityRole="button"
        focusable
        onPress={onOpenCaseGuide}
        style={styles.guideButton}
      >
        <Text style={styles.guideLink}>해당 사건 가이드 확인하기 ›</Text>
      </Pressable>

      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>신고 처리 진행률</Text>
        <Text style={styles.progressValue}>
          {Math.round(normalizedProgress)}%
        </Text>
      </View>
      <ProgressBar progress={normalizedProgress / 100} />
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  caseNumberArea: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  caseNumberButton: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    cursor: "pointer",
  },
  caseNumber: {
    flex: 1,
    flexShrink: 1,
    color: colors.text,
    fontSize: 21,
    fontWeight: "800",
  },
  copyLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  statusLabel: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  guideButton: {
    minHeight: 44,
    justifyContent: "center",
    cursor: "pointer",
  },
  guideLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "700",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  progressValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
});
