import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { NearbyAgency } from "@/features/nearby-agencies/types/nearbyAgencies";
import {
  formatDistance,
  formatTravelTime,
  getAgencyTypeLabel,
  getTravelModeLabel,
} from "@/features/nearby-agencies/utils/nearbyAgencyDisplay";
import { colors, radius, spacing } from "@/theme/tokens";

type SelectedAgencyCardProps = {
  agency: NearbyAgency | null;
  onOpenDirections: () => void;
  onCallAgency: () => void;
};

export function SelectedAgencyCard({
  agency,
  onOpenDirections,
  onCallAgency,
}: SelectedAgencyCardProps) {
  if (!agency) {
    return (
      <View style={styles.emptyCard}>
        <Ionicons
          accessibilityElementsHidden
          color={colors.textSecondary}
          name="location-outline"
          size={24}
        />
        <Text style={styles.emptyTitle}>기관을 선택해 주세요</Text>
        <Text style={styles.emptyDescription}>
          지도 marker 또는 아래 기관 목록에서 확인할 곳을 선택할 수 있습니다.
        </Text>
      </View>
    );
  }

  const travelTime = formatTravelTime(agency.travelDurationMinutes);

  return (
    <View accessibilityLabel={`${agency.name} 선택 기관 정보`} style={styles.card}>
      <View style={styles.metaRow}>
        {agency.isNearest ? (
          <Text style={styles.nearestBadge}>가장 가까운 곳</Text>
        ) : null}
        <Text style={styles.statusBadge}>{agency.operatingStatusLabel}</Text>
      </View>
      <View style={styles.distanceRow}>
        <Text style={styles.distance}>{formatDistance(agency.distanceMeters)}</Text>
        {travelTime ? <Text style={styles.travel}>
          {getTravelModeLabel(agency.travelMode)} {travelTime}
        </Text> : null}
      </View>
      <Text accessibilityRole="header" style={styles.name}>
        {agency.name}
      </Text>
      <Text style={styles.type}>{getAgencyTypeLabel(agency.type)}</Text>
      <Text style={styles.address}>{agency.address}</Text>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={`${agency.name} 길찾기`}
          accessibilityRole="button"
          accessibilityHint="외부 지도 앱 또는 웹 길찾기를 엽니다."
          accessibilityState={{ disabled: !agency.directionsAvailable }}
          disabled={!agency.directionsAvailable}
          onPress={onOpenDirections}
          style={({ pressed }) => [
            styles.primaryAction,
            pressed && styles.pressed,
            !agency.directionsAvailable && styles.disabled,
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.background}
            name="navigate-outline"
            size={21}
          />
          <Text style={styles.primaryActionText}>길찾기</Text>
        </Pressable>
        <Pressable
          accessibilityLabel={`${agency.name} 전화하기`}
          accessibilityRole="button"
          accessibilityHint="기기 전화 기능을 열며, 전화번호는 자동 저장하지 않습니다."
          accessibilityState={{ disabled: !agency.phoneNumber }}
          disabled={!agency.phoneNumber}
          onPress={onCallAgency}
          style={({ pressed }) => [
            styles.secondaryAction,
            pressed && styles.pressed,
            !agency.phoneNumber && styles.disabled,
          ]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.text}
            name="call-outline"
            size={20}
          />
          <Text style={styles.secondaryActionText}>전화하기</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  nearestBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  statusBadge: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  distanceRow: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    alignItems: "flex-end",
  },
  distance: {
    color: colors.primary,
    fontSize: 27,
    fontWeight: "900",
  },
  travel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  name: {
    maxWidth: "72%",
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 32,
  },
  type: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  address: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 23,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryAction: {
    minHeight: 56,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    cursor: "pointer",
  },
  secondaryAction: {
    minHeight: 56,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    cursor: "pointer",
  },
  primaryActionText: {
    color: colors.background,
    fontSize: 17,
    fontWeight: "800",
  },
  secondaryActionText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "700",
  },
  emptyCard: {
    alignItems: "center",
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "800" },
  emptyDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
});
