import { Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from "react-native-maps";
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

const fallbackRegion: Region = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

function getRegion(
  referenceLocation: DeviceLocation | null,
  agencies: NearbyAgency[],
): Region {
  const points = [
    ...(referenceLocation ? [referenceLocation] : []),
    ...agencies,
  ];

  if (points.length === 0) return fallbackRegion;

  const latitudes = points.map((point) => point.latitude);
  const longitudes = points.map((point) => point.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  return {
    latitude: (minLatitude + maxLatitude) / 2,
    longitude: (minLongitude + maxLongitude) / 2,
    latitudeDelta: Math.max((maxLatitude - minLatitude) * 1.8, 0.02),
    longitudeDelta: Math.max((maxLongitude - minLongitude) * 1.8, 0.02),
  };
}

export function AgencyMap({
  referenceLocation,
  agencies,
  selectedAgencyId,
  mapStatus,
  onSelectAgency,
  onRequestCurrentLocation,
  onToggleMapLayer,
}: AgencyMapProps) {
  const region = getRegion(referenceLocation, agencies);

  return (
    <View accessibilityLabel="주변 기관 지도" style={styles.container}>
      <MapView
        provider={PROVIDER_GOOGLE}
        region={region}
        showsCompass
        showsMyLocationButton={false}
        showsUserLocation={Boolean(referenceLocation)}
        style={StyleSheet.absoluteFill}
      >
        {referenceLocation ? (
          <Marker
            coordinate={referenceLocation}
            pinColor={colors.primary}
            title="현재 위치"
          />
        ) : null}
        {agencies.map((agency) => (
          <Marker
            coordinate={{
              latitude: agency.latitude,
              longitude: agency.longitude,
            }}
            description={agency.address}
            key={agency.agencyId}
            onPress={() => onSelectAgency(agency.agencyId)}
            pinColor={
              agency.agencyId === selectedAgencyId
                ? colors.primary
                : colors.error
            }
            title={agency.name}
          />
        ))}
      </MapView>

      {mapStatus !== "READY" ? (
        <View
          accessibilityRole={mapStatus === "LOADING" ? "progressbar" : "alert"}
          style={styles.mapState}
        >
          <Text style={styles.mapStateText}>
            {mapStatus === "LOADING"
              ? "지도를 준비하고 있습니다."
              : "지도를 표시할 수 없습니다."}
          </Text>
        </View>
      ) : null}

      <View style={styles.mapControls}>
        <Pressable
          accessibilityLabel="현재 위치로 지도 이동"
          accessibilityRole="button"
          onPress={onRequestCurrentLocation}
          style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}
        >
          <Ionicons color={colors.primary} name="locate-outline" size={24} />
        </Pressable>
        <Pressable
          accessibilityLabel="지도 레이어 변경"
          accessibilityRole="button"
          onPress={onToggleMapLayer}
          style={({ pressed }) => [styles.mapControl, pressed && styles.pressed]}
        >
          <Ionicons color={colors.text} name="layers-outline" size={24} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 320,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#E8EEF2",
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
  },
  mapState: {
    position: "absolute",
    top: 110,
    right: spacing.xl,
    left: spacing.xl,
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  mapStateText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  pressed: { opacity: 0.72 },
});
