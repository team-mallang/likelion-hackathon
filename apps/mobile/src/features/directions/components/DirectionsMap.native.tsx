import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";

import type { DirectionsDestination, RouteGuidance } from "@/features/directions/types/directions";
import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";
import type { DirectionsMapStatus } from "@/features/directions/views/DirectionsView.types";
import { getDirectionsMapData } from "@/features/directions/utils/directionsMapData";

type Props = {
  destination: DirectionsDestination | null;
  guidance: RouteGuidance | null;
  mapStatus: DirectionsMapStatus;
  onOpenExternalDirections: () => void;
  origin: DeviceLocation | null;
};

type Point = { latitude: number; longitude: number };

function decodePolyline(value?: string): Point[] {
  if (!value) return [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const points: Point[] = [];

  while (index < value.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do { byte = value.charCodeAt(index++) - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32);
    latitude += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do { byte = value.charCodeAt(index++) - 63; result |= (byte & 31) << shift; shift += 5; } while (byte >= 32);
    longitude += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }

  return points;
}

export function DirectionsMap({ destination, guidance, mapStatus, origin }: Props) {
  const mapData = getDirectionsMapData({ destination, guidance, origin });

  if (!mapData) {
    return <View style={styles.mapState}><Text style={styles.stateText}>{mapStatus === "LOADING" ? "경로를 불러오는 중입니다." : "경로 정보를 불러오지 못했습니다."}</Text></View>;
  }

  const { origin: mapOrigin, destination: mapDestination } = mapData;
  const region = {
    latitude: (mapOrigin.latitude + mapDestination.latitude) / 2,
    longitude: (mapOrigin.longitude + mapDestination.longitude) / 2,
    latitudeDelta: Math.max(Math.abs(mapOrigin.latitude - mapDestination.latitude) * 1.8, 0.02),
    longitudeDelta: Math.max(Math.abs(mapOrigin.longitude - mapDestination.longitude) * 1.8, 0.02),
  };

  const routePoints = decodePolyline(guidance?.polyline);
  return <MapView style={styles.map} region={region} showsUserLocation><Marker coordinate={mapOrigin} title="Current location" /><Marker coordinate={mapDestination} title={mapDestination.name} />{routePoints.length > 0 ? <Polyline coordinates={routePoints} strokeColor="#2563eb" strokeWidth={5} /> : null}</MapView>;
}

const styles = StyleSheet.create({ map: { height: 360, width: "100%" }, mapState: { height: 360, alignItems: "center", justifyContent: "center" }, stateText: { color: "#475569" } });
