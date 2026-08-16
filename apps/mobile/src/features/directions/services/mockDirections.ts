import { nearbyAgencyFixtures } from "@/features/nearby-agencies/fixtures/nearbyAgencies";

import {
  DirectionsServiceError,
  type DirectionsService,
} from "./directions";

export type MockDirectionsOptions = { delayMs?: number; failRoute?: boolean };

function wait(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

export function createMockDirectionsService(
  options: MockDirectionsOptions = {},
): DirectionsService {
  return {
    async getRoutes(query) {
      await wait(options.delayMs ?? 180);

      if (!query.caseId.trim()) {
        throw new DirectionsServiceError("INVALID_CASE_ID", "활성 사건이 없습니다.");
      }
      if (!Number.isFinite(query.origin.latitude) || !Number.isFinite(query.origin.longitude)) {
        throw new DirectionsServiceError("LOCATION_REQUIRED", "현재 위치를 확인할 수 없습니다.");
      }
      const agency = nearbyAgencyFixtures.find((item) => item.agencyId === query.agencyId);
      if (!agency) {
        throw new DirectionsServiceError("DESTINATION_NOT_FOUND", "목적지 기관을 찾을 수 없습니다.");
      }
      if (options.failRoute) {
        throw new DirectionsServiceError("ROUTE_NOT_FOUND", "경로를 확인할 수 없습니다.");
      }

      return [{
        routeId: "route-0",
        agencyId: agency.agencyId,
        travelMode: query.travelMode,
        distanceMeters: query.travelMode === "DRIVE" ? 900 : query.travelMode === "TRANSIT" ? 650 : 450,
        durationMinutes: query.travelMode === "DRIVE" ? 5 : query.travelMode === "TRANSIT" ? 8 : 6,
        routeStatus: "READY",
        origin: { ...query.origin },
        destination: {
          agencyId: agency.agencyId,
          name: agency.name,
          address: agency.address,
          latitude: agency.latitude,
          longitude: agency.longitude,
        },
        updatedAt: new Date().toISOString(),
      }];
    },
  };
}
