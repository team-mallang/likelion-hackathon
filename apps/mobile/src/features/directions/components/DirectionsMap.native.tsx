import MapView, { Marker, Polyline } from "react-native-maps";
import { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { DirectionsDestination, RouteGuidance } from "@/features/directions/types/directions";
import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";
import type { DirectionsMapStatus } from "@/features/directions/views/DirectionsView.types";
import { getDirectionsMapData } from "@/features/directions/utils/directionsMapData";

type Props = {
  destination: DirectionsDestination | null;
  routeOptions: RouteGuidance[];
  selectedRoute: RouteGuidance | null;
  mapStatus: DirectionsMapStatus;
  onOpenExternalDirections: () => void;
  onSelectRoute: (routeId: string) => void;
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

export function DirectionsMap({ destination, routeOptions, selectedRoute, mapStatus, onSelectRoute, origin }: Props) {
  const mapRef = useRef<MapView>(null);
  const mapData = getDirectionsMapData({ destination, selectedRoute, origin });
  const selectedRoutePoints = decodePolyline(selectedRoute?.polyline);

  useEffect(() => {
    if (selectedRoutePoints.length < 2) return;
    mapRef.current?.fitToCoordinates(selectedRoutePoints, {
      animated: true,
      edgePadding: { top: 48, right: 36, bottom: 48, left: 36 },
    });
  }, [selectedRoute?.routeId, selectedRoute?.polyline]);

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

  const orderedRoutes = [
    ...routeOptions.filter((route) => route.routeId !== selectedRoute?.routeId),
    ...routeOptions.filter((route) => route.routeId === selectedRoute?.routeId),
  ];

  const selectedSegments = selectedRoute?.transitSteps?.flatMap((step) => {
    const points = decodePolyline(step.polyline);
    return points.length > 0 ? [{ step, points }] : [];
  }) ?? [];

  return <MapView ref={mapRef} style={styles.map} initialRegion={region} showsUserLocation>
    <Marker coordinate={mapOrigin} title="Current location" />
    <Marker coordinate={mapDestination} title={mapDestination.name} />
    {orderedRoutes.map((route) => {
      const routePoints = decodePolyline(route.polyline);
      const isSelected = route.routeId === selectedRoute?.routeId;
      if (isSelected && selectedSegments.length > 0) return null;
      return routePoints.length > 0 ? (
        <Polyline
          coordinates={routePoints}
          key={route.routeId}
          onPress={() => onSelectRoute(route.routeId)}
          strokeColor={isSelected ? "#2563eb" : "#94a3b8"}
          strokeWidth={isSelected ? 6 : 3}
          tappable
          zIndex={isSelected ? 2 : 1}
        />
      ) : null;
    })}
    {selectedSegments.map(({ step, points }) => <Polyline
      coordinates={points}
      key={`step-${step.order}`}
      onPress={() => selectedRoute && onSelectRoute(selectedRoute.routeId)}
      strokeColor={stepColor(step.vehicleType, step.type)}
      strokeWidth={6}
      tappable
      zIndex={3}
    />)}
    {selectedRoute?.transitSteps?.flatMap((step) => step.type === "TRANSIT" ? [
      step.startLocation ? <Marker coordinate={step.startLocation} key={`board-${step.order}`} pinColor="#2563eb" title={`${step.departureStop ?? "정류장"} 승차`} /> : null,
      step.endLocation ? <Marker coordinate={step.endLocation} key={`exit-${step.order}`} pinColor="#f97316" title={`${step.arrivalStop ?? "정류장"} 하차`} /> : null,
    ] : [])}
  </MapView>;
}

function stepColor(vehicleType: string | undefined, type: "WALK" | "TRANSIT") {
  if (type === "WALK") return "#64748b";
  if (vehicleType === "SUBWAY" || vehicleType === "METRO_RAIL") return "#7c3aed";
  if (vehicleType === "TRAIN" || vehicleType === "HEAVY_RAIL" || vehicleType === "COMMUTER_TRAIN") return "#059669";
  return "#2563eb";
}

const styles = StyleSheet.create({ map: { height: 360, width: "100%" }, mapState: { height: 360, alignItems: "center", justifyContent: "center" }, stateText: { color: "#475569" } });
