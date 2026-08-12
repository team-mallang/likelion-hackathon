import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

export type LocationTrackingErrorCode =
  | "PERMISSION_DENIED"
  | "LOCATION_UNAVAILABLE"
  | "TRACKING_START_FAILED";

export class LocationTrackingError extends Error {
  constructor(public readonly code: LocationTrackingErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "LocationTrackingError";
  }
}

export type StopLocationTracking = () => void | Promise<void>;

export type LocationTrackingService = {
  start(listener: (location: DeviceLocation) => void): Promise<StopLocationTracking>;
};
