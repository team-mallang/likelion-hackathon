import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { EvidenceFileViewModel } from "@/features/documents/views/DocumentsView.types";
import { colors, radius, spacing } from "@/theme/tokens";

type EvidenceCardProps = {
  evidence: EvidenceFileViewModel;
  onOpen: (evidenceId: string) => void;
  onDelete: (evidenceId: string) => void;
  isDeleting: boolean;
};

export function EvidenceCard({
  evidence,
  onOpen,
  onDelete,
  isDeleting,
}: EvidenceCardProps) {
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityLabel={`${evidence.title} 미리보기`}
        accessibilityRole="button"
        onPress={() => onOpen(evidence.id)}
        style={styles.iconArea}
      >
        {evidence.previewUri ? <Image source={{ uri: evidence.previewUri, headers: evidence.previewHeaders }} style={styles.thumbnail} /> : <Ionicons color={colors.primary} name="camera-outline" size={24} />}
      </Pressable>

      <Pressable
        accessibilityLabel={`${evidence.title} 열기`}
        accessibilityRole="button"
        focusable
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
      </Pressable>
      {evidence.canDelete ? <Pressable accessibilityLabel={`${evidence.title} 삭제`} accessibilityRole="button" disabled={isDeleting} onPress={() => onDelete(evidence.id)} style={styles.deleteButton}>
        <Ionicons color={colors.error} name="trash-outline" size={20} />
      </Pressable> : null}

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
  thumbnail: { width: "100%", height: "100%", borderRadius: radius.md },
  deleteButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  textArea: {
    flex: 1,
    gap: spacing.xs,
    cursor: "pointer",
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
});
