import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";
import { expoLocationService, LocationError } from "@/services/device/location";

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

export function createExpoLocationPermissionService(): LocationPermissionService {
  return {
    async getStatus() {
      return expoLocationService.getPermissionStatus();
    },
    async request() {
      return expoLocationService.requestPermission();
    },
    async getCurrentLocation() {
      try {
        const result = await expoLocationService.getCurrentLocation();
        return {
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
          accuracyMeters: result.coordinates.accuracyMeters ?? undefined,
        };
      } catch (error) {
        if (error instanceof LocationError) {
          throw error;
        }
        throw new Error("현재 위치를 확인하지 못했습니다.");
      }
    },
  };
}
