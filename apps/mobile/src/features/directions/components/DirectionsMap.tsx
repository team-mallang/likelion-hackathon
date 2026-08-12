import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { RouteGuidance } from "@/features/directions/types/directions";
import type { DirectionsMapStatus } from "@/features/directions/views/DirectionsView.types";
import { colors, radius, spacing } from "@/theme/tokens";

type DirectionsMapProps = {
  guidance: RouteGuidance | null;
  mapStatus: DirectionsMapStatus;
  onOpenExternalDirections: () => void;
};

export function DirectionsMap({
  guidance,
  mapStatus,
  onOpenExternalDirections,
}: DirectionsMapProps) {
  const destinationName = guidance?.destination.name ?? "선택한 기관";

  return (
    <View accessibilityLabel={`${destinationName} 경로 지도`} style={styles.map}>
      <View pointerEvents="none" style={styles.mapGrid} />
      {mapStatus === "LOADING" ? (
        <View accessibilityRole="progressbar" style={styles.stateCard}>
          <Text style={styles.stateTitle}>지도를 준비하고 있습니다.</Text>
        </View>
      ) : mapStatus === "UNAVAILABLE" ? (
        <View accessibilityRole="alert" style={styles.stateCard}>
          <Ionicons
            accessibilityElementsHidden
            color={colors.textSecondary}
            name="map-outline"
            size={28}
          />
          <Text style={styles.stateTitle}>지도를 표시할 수 없습니다.</Text>
          <Pressable
            accessibilityLabel="외부 지도에서 길찾기"
            accessibilityRole="button"
            onPress={onOpenExternalDirections}
            style={({ pressed }) => [styles.externalButton, pressed && styles.pressed]}
          >
            <Text style={styles.externalButtonText}>외부 지도 열기</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <View accessibilityLabel="현재 위치" style={styles.currentLocation}>
            <View style={styles.currentLocationDot} />
          </View>
          <View pointerEvents="none" style={styles.routeLine} />
          <View accessibilityLabel={`${destinationName} 목적지`} style={styles.destination}>
            <Ionicons
              accessibilityElementsHidden
              color={colors.background}
              name="location"
              size={22}
            />
          </View>
          <View pointerEvents="none" style={styles.destinationLabel}>
            <Text numberOfLines={1} style={styles.destinationLabelText}>
              {destinationName}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 360,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#E8EEF2",
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.58,
    backgroundColor: "#D5E2E7",
    borderWidth: 18,
    borderColor: "#F9FBFC",
  },
  currentLocation: {
    position: "absolute",
    top: 196,
    left: "22%",
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 10,
    borderColor: "rgba(37,99,235,0.18)",
    borderRadius: 24,
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  currentLocationDot: {
    width: 17,
    height: 17,
    borderWidth: 3,
    borderColor: colors.background,
    borderRadius: 9,
    backgroundColor: colors.primary,
  },
  routeLine: {
    position: "absolute",
    top: 150,
    left: "31%",
    width: "42%",
    height: 4,
    borderRadius: 4,
    transform: [{ rotate: "-25deg" }],
    backgroundColor: colors.primary,
  },
  destination: {
    position: "absolute",
    top: 104,
    left: "71%",
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
    borderRadius: 21,
    backgroundColor: colors.error,
  },
  destinationLabel: {
    position: "absolute",
    top: 148,
    right: spacing.md,
    maxWidth: "54%",
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  destinationLabelText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  stateCard: {
    position: "absolute",
    top: 120,
    right: spacing.lg,
    left: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  stateTitle: { color: colors.text, fontSize: 15, fontWeight: "800" },
  externalButton: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    cursor: "pointer",
  },
  externalButtonText: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  pressed: { opacity: 0.72 },
});
