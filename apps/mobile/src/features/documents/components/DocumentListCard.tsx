import { Pressable, StyleSheet, Text, View } from "react-native";

import type { GeneratedDocument } from "@/features/documents/types/documents";
import { colors, radius, spacing } from "@/theme/tokens";

type DocumentListCardProps = {
  document: GeneratedDocument;
  onOpen: (documentId: string) => void;
};

export function DocumentListCard({
  document,
  onOpen,
}: DocumentListCardProps) {
  const isReady = document.status === "READY";
  const isGenerating = document.status === "GENERATING";
  const actionLabel = isReady
    ? "보기"
    : isGenerating
      ? "준비 중"
      : "생성 실패";

  return (
    <View style={styles.card}>
      <View accessibilityElementsHidden style={styles.iconArea}>
        <Text style={styles.iconLabel}>문서</Text>
      </View>

      <View style={styles.textArea}>
        <Text style={styles.title}>{document.title}</Text>
        <Text numberOfLines={3} style={styles.description}>
          {document.description}
        </Text>
        {document.status === "FAILED" ? (
          <Text accessibilityRole="alert" style={styles.errorText}>
            문서를 생성하지 못했습니다.
          </Text>
        ) : null}
      </View>

      <Pressable
        accessibilityLabel={`${document.title} ${actionLabel}`}
        accessibilityRole="button"
        accessibilityState={{
          busy: isGenerating,
          disabled: !isReady,
        }}
        disabled={!isReady}
        onPress={() => onOpen(document.id)}
        style={[
          styles.actionButton,
          !isReady && styles.actionButtonDisabled,
        ]}
      >
        <Text
          style={[
            styles.actionLabel,
            !isReady && styles.actionLabelDisabled,
          ]}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  iconArea: {
    width: 44,
    height: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  iconLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  textArea: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
  },
  actionButton: {
    minWidth: 64,
    minHeight: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  actionButtonDisabled: {
    backgroundColor: colors.surface,
  },
  actionLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  actionLabelDisabled: {
    color: colors.disabled,
  },
});
