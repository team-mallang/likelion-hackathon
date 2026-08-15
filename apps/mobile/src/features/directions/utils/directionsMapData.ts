import type { DirectionsDestination, RouteGuidance } from "@/features/directions/types/directions";
import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

export type DirectionsMapData = {
  origin: DeviceLocation;
  destination: DirectionsDestination;
};

export function getDirectionsMapData({
  destination,
  guidance,
  origin,
}: {
  destination: DirectionsDestination | null;
  guidance: RouteGuidance | null;
  origin: DeviceLocation | null;
}): DirectionsMapData | null {
  const mapOrigin = guidance?.origin ?? origin;
  const mapDestination = guidance?.destination ?? destination;

  return mapOrigin && mapDestination ? { origin: mapOrigin, destination: mapDestination } : null;
}
