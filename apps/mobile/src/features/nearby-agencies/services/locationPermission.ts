import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

export type LocationPermissionStatus =
  | "granted"
  | "denied"
  | "undetermined";

export type LocationPermission = {
  status: LocationPermissionStatus;
  canAskAgain: boolean;
};

export type LocationPermissionService = {
  getStatus(): Promise<LocationPermission>;
  request(): Promise<LocationPermission>;
  getCurrentLocation(): Promise<DeviceLocation>;
};
