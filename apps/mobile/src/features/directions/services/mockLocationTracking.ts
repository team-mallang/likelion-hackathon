import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

import type { LocationTrackingService, StopLocationTracking } from "./locationTracking";

export function createMockLocationTrackingService(
  location: DeviceLocation = { latitude: 35.6595, longitude: 139.7005, accuracyMeters: 25 },
): LocationTrackingService {
  return {
    async start(listener) {
      let stopped = false;
      const timer = setTimeout(() => {
        if (!stopped) listener({ ...location });
      }, 120);
      const stop: StopLocationTracking = () => {
        stopped = true;
        clearTimeout(timer);
      };
      return stop;
    },
  };
}
