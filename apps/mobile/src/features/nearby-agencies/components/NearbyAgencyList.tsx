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

type NearbyAgencyListProps = {
  agencies: NearbyAgency[];
  selectedAgencyId: string | null;
  onSelectAgency: (agencyId: string) => void;
};

export function NearbyAgencyList({
  agencies,
  selectedAgencyId,
  onSelectAgency,
}: NearbyAgencyListProps) {
  return (
    <View accessibilityLabel="주변 기관 리스트" style={styles.list}>
      {agencies.map((agency) => (
        <Pressable
          accessibilityLabel={`${agency.name}, ${getAgencyTypeLabel(agency.type)}, ${agency.operatingStatusLabel}, ${formatDistance(agency.distanceMeters)}`}
          accessibilityRole="button"
          accessibilityState={{ selected: selectedAgencyId === agency.agencyId }}
          key={agency.agencyId}
          onPress={() => onSelectAgency(agency.agencyId)}
          style={({ pressed }) => [
            styles.row,
            selectedAgencyId === agency.agencyId && styles.rowSelected,
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.iconBox}>
            <Ionicons
              accessibilityElementsHidden
              color={colors.primary}
              name={agency.type === "EMBASSY" ? "business-outline" : "shield-outline"}
              size={24}
            />
          </View>
          <View style={styles.body}>
            <View style={styles.nameRow}>
              <Text numberOfLines={2} style={styles.name}>
                {agency.name}
              </Text>
              <Text
                style={[
                  styles.status,
                  agency.operatingStatus === "CLOSED" && styles.statusClosed,
                  agency.operatingStatus === "UNKNOWN" && styles.statusUnknown,
                ]}
              >
                {agency.operatingStatusLabel}
              </Text>
            </View>
            <Text style={styles.details}>
              {formatDistance(agency.distanceMeters)}{agency.travelMode && agency.travelDurationMinutes !== undefined ? ` · ${getTravelModeLabel(agency.travelMode)} ${formatTravelTime(agency.travelDurationMinutes)}` : ""}
            </Text>
          </View>
          <Ionicons
            accessibilityElementsHidden
            color={colors.border}
            name="chevron-forward"
            size={22}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm,
    marginHorizontal: spacing.md,
  },
  row: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    cursor: "pointer",
  },
  rowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  iconBox: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  body: { flex: 1, gap: spacing.xs },
  nameRow: { gap: spacing.xs },
  name: { color: colors.text, fontSize: 15, fontWeight: "800", lineHeight: 20 },
  status: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  statusClosed: { color: colors.textSecondary, backgroundColor: colors.surface },
  statusUnknown: { color: colors.textSecondary, backgroundColor: colors.surface },
  details: { color: colors.textSecondary, fontSize: 13 },
  pressed: { opacity: 0.76 },
});
