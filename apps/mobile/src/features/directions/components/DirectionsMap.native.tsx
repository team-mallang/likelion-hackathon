import MapView, { Marker, Polyline } from "react-native-maps";
import { StyleSheet, Text, View } from "react-native";

import type { RouteGuidance } from "@/features/directions/types/directions";
import type { DirectionsMapStatus } from "@/features/directions/views/DirectionsView.types";

type Props = {
  guidance: RouteGuidance | null;
  mapStatus: DirectionsMapStatus;
  onOpenExternalDirections: () => void;
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

export function DirectionsMap({ guidance, mapStatus }: Props) {
  const origin = guidance?.origin;
  const destination = guidance?.destination;

  if (!origin || !destination) {
    return <View style={styles.map}><Text>{mapStatus === "LOADING" ? "Loading route…" : "No route is available."}</Text></View>;
  }

  const region = {
    latitude: (origin.latitude + destination.latitude) / 2,
    longitude: (origin.longitude + destination.longitude) / 2,
    latitudeDelta: Math.max(Math.abs(origin.latitude - destination.latitude) * 1.8, 0.02),
    longitudeDelta: Math.max(Math.abs(origin.longitude - destination.longitude) * 1.8, 0.02),
  };

  return <MapView style={styles.map} region={region} showsUserLocation><Marker coordinate={origin} title="Current location" /><Marker coordinate={destination} title={destination.name} /><Polyline coordinates={decodePolyline(guidance.polyline)} strokeColor="#2563eb" strokeWidth={5} /></MapView>;
}

const styles = StyleSheet.create({ map: { height: 360, width: "100%" } });
