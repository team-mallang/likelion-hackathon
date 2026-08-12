import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

export type DirectionsTravelMode = "WALK" | "TRANSIT" | "DRIVE";

export type RouteStatus = "READY" | "NAVIGATING" | "ARRIVED" | "FAILED";

export type DirectionsDestination = {
  agencyId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export type RouteGuidance = {
  agencyId: string;
  travelMode: DirectionsTravelMode;
  distanceMeters?: number;
  durationMinutes?: number;
  routeStatus: RouteStatus;
  origin: DeviceLocation | null;
  destination: DirectionsDestination;
  polyline?: string;
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
};
