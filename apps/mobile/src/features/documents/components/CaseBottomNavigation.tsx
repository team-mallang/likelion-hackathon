import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, radius, spacing } from "@/theme/tokens";

type CaseBottomNavigationProps = {
  activeTab?: "guide" | "documents";
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};

type NavigationItemProps = {
  icon: "guide" | "documents";
  label: string;
  active?: boolean;
  onPress: () => void;
};

export function CaseBottomNavigation({
  activeTab = "documents",
  onGuideTab,
  onDocumentsTab,
}: CaseBottomNavigationProps) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      <NavigationItem
        active={activeTab === "guide"}
        icon="guide"
        label="가이드"
        onPress={onGuideTab}
      />
      <NavigationItem
        active={activeTab === "documents"}
        icon="documents"
        label="서류"
        onPress={onDocumentsTab}
      />
    </View>
  );
}

function NavigationItem({
  icon,
  label,
  active = false,
  onPress,
}: NavigationItemProps) {
  return (
    <Pressable
      accessibilityLabel={`${label} 탭`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      focusable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemActive,
        pressed && styles.itemPressed,
      ]}
    >
      <Ionicons
        accessibilityElementsHidden
        color={active ? colors.background : colors.textSecondary}
        name={
          icon === "guide" ? "book-outline" : "document-text-outline"
        }
        size={22}
      />
      <Text style={[styles.label, active && styles.labelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 480,
    minHeight: 64,
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  item: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.lg,
    cursor: "pointer",
  },
  itemActive: {
    backgroundColor: colors.primary,
  },
  itemPressed: {
    opacity: 0.75,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.background,
  },
});
