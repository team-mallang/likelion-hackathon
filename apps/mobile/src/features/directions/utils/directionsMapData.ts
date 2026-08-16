import type { DirectionsDestination, RouteGuidance } from "@/features/directions/types/directions";
import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

export type DirectionsMapData = {
  origin: DeviceLocation;
  destination: DirectionsDestination;
};

export function getDirectionsMapData({
  destination,
  selectedRoute,
  origin,
}: {
  destination: DirectionsDestination | null;
  selectedRoute: RouteGuidance | null;
  origin: DeviceLocation | null;
}): DirectionsMapData | null {
  const mapOrigin = selectedRoute?.origin ?? origin;
  const mapDestination = selectedRoute?.destination ?? destination;

  return mapOrigin && mapDestination ? { origin: mapOrigin, destination: mapDestination } : null;
}
