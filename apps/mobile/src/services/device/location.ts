import * as ExpoLocation from "expo-location";

import type {
  DevicePermissionResult,
} from "@/services/device/audioRecorder";

const LOCATION_TIMEOUT_MS = 15_000;

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

function toDevicePermissionResult(
  result: Awaited<
    ReturnType<typeof ExpoLocation.getForegroundPermissionsAsync>
  >,
): DevicePermissionResult {
  return {
    status:
      result.status === "granted"
        ? "granted"
        : result.status === "denied"
          ? "denied"
          : "undetermined",
    canAskAgain: result.canAskAgain,
  };
}

async function withLocationTimeout<T>(promise: Promise<T>) {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new LocationError(
          "TIMEOUT",
          "현재 위치를 확인하는 데 시간이 너무 오래 걸립니다.",
        ),
      );
    }, LOCATION_TIMEOUT_MS);
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function getUniqueAddressParts(parts: Array<string | null>) {
  return [...new Set(parts.filter((part): part is string => Boolean(part?.trim())))];
}

export const expoLocationService: LocationService = {
  async getPermissionStatus() {
    try {
      const result =
        await ExpoLocation.getForegroundPermissionsAsync();
      return toDevicePermissionResult(result);
    } catch (error) {
      throw new LocationError(
        "UNKNOWN",
        "위치 권한 상태를 확인하지 못했습니다.",
        { cause: error },
      );
    }
  },

  async requestPermission() {
    try {
      const result =
        await ExpoLocation.requestForegroundPermissionsAsync();
      return toDevicePermissionResult(result);
    } catch (error) {
      throw new LocationError(
        "UNKNOWN",
        "위치 권한을 요청하지 못했습니다.",
        { cause: error },
      );
    }
  },

  async getCurrentLocation() {
    try {
      const permission =
        await ExpoLocation.getForegroundPermissionsAsync();

      if (!permission.granted) {
        throw new LocationError(
          "PERMISSION_DENIED",
          "현재 위치를 확인하려면 위치 권한이 필요합니다.",
        );
      }

      const locationServicesEnabled =
        await ExpoLocation.hasServicesEnabledAsync();

      if (!locationServicesEnabled) {
        throw new LocationError(
          "LOCATION_UNAVAILABLE",
          "기기의 위치 서비스가 꺼져 있습니다.",
        );
      }

      const result = await withLocationTimeout(
        ExpoLocation.getCurrentPositionAsync({
          accuracy: ExpoLocation.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        }),
      );

      return {
        coordinates: {
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracyMeters: result.coords.accuracy,
        },
        capturedAt: new Date(result.timestamp).toISOString(),
      };
    } catch (error) {
      if (error instanceof LocationError) {
        throw error;
      }

      throw new LocationError(
        "LOCATION_UNAVAILABLE",
        "현재 위치를 확인하지 못했습니다.",
        { cause: error },
      );
    }
  },

  async formatLocation(location) {
    try {
      const addresses = await ExpoLocation.reverseGeocodeAsync({
        latitude: location.coordinates.latitude,
        longitude: location.coordinates.longitude,
      });
      const address = addresses[0];

      if (!address) {
        throw new LocationError(
          "FORMAT_FAILED",
          "현재 위치의 주소를 찾지 못했습니다.",
        );
      }

      if (address.formattedAddress?.trim()) {
        return address.formattedAddress.trim();
      }

      const street = [address.streetNumber, address.street]
        .filter(Boolean)
        .join(" ") || null;
      const addressParts = getUniqueAddressParts([
        address.country,
        address.region,
        address.city,
        address.district,
        street,
        address.name,
      ]);

      if (addressParts.length === 0) {
        throw new LocationError(
          "FORMAT_FAILED",
          "현재 위치의 주소를 표시할 수 없습니다.",
        );
      }

      return addressParts.join(" ");
    } catch (error) {
      if (error instanceof LocationError) {
        throw error;
      }

      throw new LocationError(
        "FORMAT_FAILED",
        "현재 위치의 주소를 변환하지 못했습니다.",
        { cause: error },
      );
    }
  },
};
