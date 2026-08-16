import type {
  DirectionsDestination,
  DirectionsTravelMode,
  RouteGuidance,
} from "@/features/directions/types/directions";

export const directionsDestinationFixture: DirectionsDestination = {
  agencyId: "shibuya-police-station",
  name: "시부야 경찰서 (Shibuya PS)",
  address: "도쿄도 시부야구 시부야 3-22-1",
  latitude: 35.6595,
  longitude: 139.7005,
};

export const directionsTravelModesFixture: DirectionsTravelMode[] = [
  "WALK",
  "TRANSIT",
  "DRIVE",
];

export const directionsReadyFixture: RouteGuidance = {
  routeId: "route-0",
  agencyId: directionsDestinationFixture.agencyId,
  travelMode: "WALK",
  distanceMeters: 450,
  durationMinutes: 6,
  routeStatus: "READY",
  origin: null,
  destination: directionsDestinationFixture,
  updatedAt: "2026-08-12T00:00:00.000Z",
};

export const directionsNavigatingFixture: RouteGuidance = {
  ...directionsReadyFixture,
  routeStatus: "NAVIGATING",
};

export const directionsArrivedFixture: RouteGuidance = {
  ...directionsReadyFixture,
  routeStatus: "ARRIVED",
};

export const directionsUnavailableFixture: RouteGuidance = {
  ...directionsReadyFixture,
  distanceMeters: undefined,
  durationMinutes: undefined,
  polyline: undefined,
};
