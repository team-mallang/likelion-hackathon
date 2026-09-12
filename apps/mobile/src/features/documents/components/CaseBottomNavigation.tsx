import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/tokens";

type CaseBottomNavigationProps = {
  activeTab?: "guide" | "map" | "documents";
  /** @deprecated Use onMapTab. Kept while older case views migrate. */
  onCaseTab?: () => void;
  onGuideTab: () => void;
  onMapTab?: () => void;
  onDocumentsTab: () => void;
};

type NavigationItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
};

export function CaseBottomNavigation({
  activeTab = "documents",
  onCaseTab,
  onGuideTab,
  onMapTab,
  onDocumentsTab,
}: CaseBottomNavigationProps) {
  return (
    <View accessibilityRole="tablist" style={styles.container}>
      <NavigationItem
        active={activeTab === "guide"}
        icon="book-outline"
        label="가이드"
        onPress={onGuideTab}
      />
      <NavigationItem
        active={activeTab === "map"}
        icon="map-outline"
        label="지도"
        onPress={onMapTab ?? onCaseTab ?? onGuideTab}
      />
      <NavigationItem
        active={activeTab === "documents"}
        icon="document-text-outline"
        label="서류"
        onPress={onDocumentsTab}
      />
    </View>
  );
}

function NavigationItem({
  icon,
  label,
  active,
  onPress,
}: NavigationItemProps) {
  const itemColor = active ? colors.primary : colors.textSecondary;

  return (
    <Pressable
      accessibilityLabel={`${label} 탭`}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      focusable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        pressed && styles.itemPressed,
      ]}
    >
      <Ionicons
        accessibilityElementsHidden
        color={itemColor}
        name={icon}
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
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  item: {
    minHeight: 64,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    cursor: "pointer",
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
    color: colors.primary,
  },
});
