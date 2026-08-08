import type {
  DevicePermissionResult,
} from "@/services/device/audioRecorder";

export type Coordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
};

export type CurrentLocation = {
  coordinates: Coordinates;
  capturedAt: string;
};

export type LocationService = {
  getPermissionStatus: () => Promise<DevicePermissionResult>;
  requestPermission: () => Promise<DevicePermissionResult>;
  getCurrentLocation: () => Promise<CurrentLocation>;
  formatLocation: (location: CurrentLocation) => Promise<string>;
};

export type LocationErrorCode =
  | "PERMISSION_DENIED"
  | "TIMEOUT"
  | "LOCATION_UNAVAILABLE"
  | "FORMAT_FAILED"
  | "UNKNOWN";

export class LocationError extends Error {
  constructor(
    public readonly code: LocationErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "LocationError";
  }
}
