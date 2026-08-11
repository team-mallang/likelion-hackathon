import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type {
  DeviceLocation,
  NearbyAgency,
} from "@/features/nearby-agencies/types/nearbyAgencies";
import type { NearbyAgenciesMapStatus } from "@/features/nearby-agencies/views/NearbyAgenciesView.types";
import { colors, radius, spacing } from "@/theme/tokens";

type AgencyMapProps = {
  referenceLocation: DeviceLocation | null;
  agencies: NearbyAgency[];
  selectedAgencyId: string | null;
  mapStatus: NearbyAgenciesMapStatus;
  onSelectAgency: (agencyId: string) => void;
  onRequestCurrentLocation: () => void;
  onToggleMapLayer: () => void;
};

export function AgencyMap({
  referenceLocation,
  agencies,
  selectedAgencyId,
  mapStatus,
  onSelectAgency,
  onRequestCurrentLocation,
  onToggleMapLayer,
}: AgencyMapProps) {
  return (
    <View accessibilityLabel="주변 기관 지도" style={styles.map}>
      <View pointerEvents="none" style={styles.mapGrid} />
      <View style={styles.mapLabelArea}>
        <Text style={styles.mapEyebrow}>S12 주변 기관 안내</Text>
        <Text style={styles.mapSubline}>
          {referenceLocation ? "현재 위치 기준" : "위치 확인 전"}
        </Text>
      </View>

      {mapStatus === "LOADING" ? (
        <View accessibilityRole="progressbar" style={styles.mapState}>
          <Text style={styles.mapStateText}>지도를 준비하고 있습니다.</Text>
        </View>
      ) : mapStatus === "UNAVAILABLE" ? (
        <View accessibilityRole="alert" style={styles.mapState}>
          <Ionicons
            accessibilityElementsHidden
            color={colors.textSecondary}
            name="map-outline"
            size={28}
          />
          <Text style={styles.mapStateText}>지도를 표시할 수 없습니다.</Text>
          <Text style={styles.mapStateHint}>아래 기관 목록에서 선택해 주세요.</Text>
        </View>
      ) : (
        <>
          <View accessibilityLabel="현재 위치" style={styles.currentLocation}>
            <View style={styles.currentLocationDot} />
          </View>
          {agencies.slice(0, 4).map((agency, index) => (
            <Pressable
              accessibilityLabel={`${agency.name}, ${agency.operatingStatusLabel}`}
              accessibilityRole="button"
              key={agency.agencyId}
              onPress={() => onSelectAgency(agency.agencyId)}
              style={[
                styles.agencyMarker,
                markerPositionStyle(index),
                selectedAgencyId === agency.agencyId && styles.agencyMarkerSelected,
              ]}
            >
              <Ionicons
                accessibilityElementsHidden
                color={colors.background}
                name="shield-checkmark"
                size={16}
              />
            </Pressable>
          ))}
        </>
      )}

      <View style={styles.mapControls}>
        <Pressable
          accessibilityLabel="현재 위치로 지도 이동"
          accessibilityRole="button"
          onPress={onRequestCurrentLocation}
          style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.primary}
            name="locate-outline"
            size={24}
          />
        </Pressable>
        <Pressable
          accessibilityLabel="지도 레이어 변경"
          accessibilityRole="button"
          onPress={onToggleMapLayer}
          style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}
        >
          <Ionicons
            accessibilityElementsHidden
            color={colors.text}
            name="layers-outline"
            size={24}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 320,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#E8EEF2",
  },
  mapGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
    backgroundColor: "#D4E0E5",
    borderWidth: 18,
    borderColor: "#F8FAFC",
  },
  mapLabelArea: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: "rgba(255,255,255,0.88)",
  },
  mapEyebrow: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
  },
  mapSubline: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  currentLocation: {
    position: "absolute",
    top: 142,
    left: "27%",
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 12,
    borderColor: "rgba(37,99,235,0.18)",
    borderRadius: 28,
    backgroundColor: "rgba(37,99,235,0.12)",
  },
  currentLocationDot: {
    width: 18,
    height: 18,
    borderWidth: 3,
    borderColor: colors.background,
    borderRadius: 9,
    backgroundColor: colors.primary,
  },
  agencyMarker: {
    position: "absolute",
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: colors.background,
    borderRadius: 19,
    backgroundColor: colors.error,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  marker1: { top: 148, left: "72%" },
  marker2: { top: 96, left: "54%" },
  marker3: { top: 212, left: "60%" },
  marker4: { top: 72, left: "80%" },
  agencyMarkerSelected: {
    transform: [{ scale: 1.18 }],
    backgroundColor: colors.primary,
  },
  mapControls: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    gap: spacing.sm,
  },
  mapControl: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: colors.background,
    cursor: "pointer",
  },
  mapState: {
    position: "absolute",
    top: 110,
    right: spacing.xl,
    left: spacing.xl,
    alignItems: "center",
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  mapStateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  mapStateHint: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  pressed: { opacity: 0.72 },
});

function markerPositionStyle(index: number) {
  switch (index) {
    case 0:
      return styles.marker1;
    case 1:
      return styles.marker2;
    case 2:
      return styles.marker3;
    default:
      return styles.marker4;
  }
}
