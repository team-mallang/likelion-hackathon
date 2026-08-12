import * as ExpoLocation from "expo-location";

import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";
import { LocationTrackingError, type LocationTrackingService } from "./locationTracking";

function toDeviceLocation(location: ExpoLocation.LocationObject): DeviceLocation {
  return { latitude: location.coords.latitude, longitude: location.coords.longitude, accuracyMeters: location.coords.accuracy ?? undefined };
}

/** Foreground-only adapter. Background tracking is intentionally not enabled. */
export function createExpoLocationTrackingService(): LocationTrackingService {
  return {
    async start(listener) {
      const permission = await ExpoLocation.getForegroundPermissionsAsync();
      if (!permission.granted) throw new LocationTrackingError("PERMISSION_DENIED", "위치 권한이 필요합니다.");
      if (!(await ExpoLocation.hasServicesEnabledAsync())) throw new LocationTrackingError("LOCATION_UNAVAILABLE", "기기 위치 서비스를 켜 주세요.");

      try {
        const subscription = await ExpoLocation.watchPositionAsync({ accuracy: ExpoLocation.Accuracy.Balanced, distanceInterval: 10, timeInterval: 3000 }, (location) => listener(toDeviceLocation(location)));
        return () => subscription.remove();
      } catch (error) {
        throw new LocationTrackingError("TRACKING_START_FAILED", "위치 안내를 시작할 수 없습니다.", { cause: error });
      }
    },
  };
}
