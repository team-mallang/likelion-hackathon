import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  EvidenceActionError,
  EvidenceFileViewModel,
} from "@/features/documents/views/DocumentsView.types";
import { colors, radius, spacing } from "@/theme/tokens";

type EvidenceCardProps = {
  evidence: EvidenceFileViewModel;
  isSharing: boolean;
  actionError: EvidenceActionError | null;
  onOpen: (evidenceId: string) => void;
  onShare: (evidenceId: string) => void;
};

export function EvidenceCard({
  evidence,
  isSharing,
  actionError,
  onOpen,
  onShare,
}: EvidenceCardProps) {
  const errorMessage =
    actionError?.evidenceId === evidence.id ? actionError.message : null;

  return (
    <View style={styles.card}>
      <View accessibilityElementsHidden style={styles.iconArea}>
        <Text style={styles.iconLabel}>사진</Text>
      </View>

      <Pressable
        accessibilityLabel={`${evidence.title} 열기`}
        accessibilityRole="button"
        onPress={() => onOpen(evidence.id)}
        style={styles.textArea}
      >
        <Text style={styles.title}>{evidence.title}</Text>
        <Text style={styles.description}>{evidence.description}</Text>
        <Text style={styles.registeredAt}>{evidence.registeredAtLabel}</Text>
        {evidence.deliveryDescription ? (
          <Text style={styles.deliveryText}>
            {evidence.deliveryDescription}
          </Text>
        ) : null}
        {errorMessage ? (
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {errorMessage}
          </Text>
        ) : null}
      </Pressable>

      <Pressable
        accessibilityLabel={`${evidence.title} 공유`}
        accessibilityRole="button"
        accessibilityState={{ busy: isSharing, disabled: isSharing }}
        disabled={isSharing}
        onPress={() => onShare(evidence.id)}
        style={styles.shareButton}
      >
        <Text style={styles.shareLabel}>
          {isSharing ? "공유 중" : "공유"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 112,
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
  registeredAt: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  deliveryText: {
    color: colors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
  },
  shareButton: {
    minWidth: 64,
    minHeight: 44,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
  },
  shareLabel: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
