import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

export type DirectionsTravelMode = "WALK" | "TRANSIT" | "DRIVE";

export type RouteStatus = "READY" | "NAVIGATING" | "ARRIVED" | "FAILED";

export type TransitRouteStep = {
  order: number;
  type: "WALK" | "TRANSIT";
  instruction?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  departureStop?: string;
  arrivalStop?: string;
  lineName?: string;
  vehicleType?: string;
  stopCount?: number;
  headsign?: string;
  departureTime?: string;
  arrivalTime?: string;
  localizedDepartureTime?: string;
  localizedArrivalTime?: string;
  departureTimeZone?: string;
  arrivalTimeZone?: string;
  headwaySeconds?: number;
  tripShortText?: string;
  agencyName?: string;
  polyline?: string;
  startLocation?: { latitude: number; longitude: number };
  endLocation?: { latitude: number; longitude: number };
};

export type DirectionsDestination = {
  agencyId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type RouteGuidance = {
  routeId: string;
  routePreference?: "DEFAULT" | "FEWER_TRANSFERS" | "LESS_WALKING";
  agencyId: string;
  travelMode: DirectionsTravelMode;
  distanceMeters?: number;
  durationMinutes?: number;
  routeStatus: RouteStatus;
  origin: DeviceLocation | null;
  destination: DirectionsDestination;
  polyline?: string;
  transitSteps?: TransitRouteStep[];
  updatedAt: string;
};

export type DirectionsQuery = {
  caseId: string;
  accessToken?: string;
  agencyId: string;
  travelMode: DirectionsTravelMode;
  origin: DeviceLocation;
};

/** S12에서 S13으로 전달하는 최소 정보. 좌표·전화번호·token은 포함하지 않는다. */
export type DirectionsNavigationTarget = {
  agencyId: string;
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  origin: DeviceLocation;
  distanceMeters?: number;
};
