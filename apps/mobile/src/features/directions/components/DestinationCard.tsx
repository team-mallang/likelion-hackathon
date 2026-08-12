import { StyleSheet, Text, View } from "react-native";

import type {
  DirectionsDestination,
  RouteGuidance,
} from "@/features/directions/types/directions";
import {
  formatRouteDistance,
  formatRouteDuration,
} from "@/features/directions/utils/directionDisplay";
import { colors, radius, spacing } from "@/theme/tokens";

type DestinationCardProps = {
  destination: DirectionsDestination | null;
  guidance: RouteGuidance | null;
};

export function DestinationCard({ destination, guidance }: DestinationCardProps) {
  if (!destination) {
    return (
      <View accessibilityRole="alert" style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>목적지 정보가 없습니다.</Text>
        <Text style={styles.emptyDescription}>인근 기관 화면에서 기관을 다시 선택해 주세요.</Text>
      </View>
    );
  }

  return (
    <View accessibilityLabel={`${destination.name} 목적지 정보`} style={styles.card}>
      <View style={styles.distanceBlock}>
        <Text style={styles.distance}>{formatRouteDistance(guidance?.distanceMeters)}</Text>
        <Text style={styles.duration}>{formatRouteDuration(guidance?.durationMinutes)}</Text>
      </View>
      <Text accessibilityRole="header" style={styles.name}>
        {destination.name}
      </Text>
      <Text style={styles.address}>{destination.address}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: -20,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  distanceBlock: { position: "absolute", top: spacing.lg, right: spacing.lg, alignItems: "flex-end" },
  distance: { color: colors.primary, fontSize: 22, fontWeight: "900" },
  duration: { color: colors.textSecondary, fontSize: 13 },
  name: { maxWidth: "68%", color: colors.text, fontSize: 18, fontWeight: "900", lineHeight: 25 },
  address: { maxWidth: "72%", color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  emptyCard: { marginHorizontal: spacing.md, marginTop: -20, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.background },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  emptyDescription: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
});
