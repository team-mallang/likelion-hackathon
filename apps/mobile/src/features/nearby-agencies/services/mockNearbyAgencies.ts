import type {
  NearbyAgenciesQuery,
  NearbyAgenciesResult,
} from "@/features/nearby-agencies/types/nearbyAgencies";

import {
  NearbyAgenciesServiceError,
  type NearbyAgenciesService,
} from "./nearbyAgencies";
import { nearbyAgencyFixtures } from "../fixtures/nearbyAgencies";

export type MockNearbyAgenciesOptions = {
  delayMs?: number;
  failLoad?: boolean;
  empty?: boolean;
};

function wait(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

function isValidLocation(query: NearbyAgenciesQuery) {
  return (
    Number.isFinite(query.location.latitude) &&
    Number.isFinite(query.location.longitude)
  );
}

export function createMockNearbyAgenciesService(
  options: MockNearbyAgenciesOptions = {},
): NearbyAgenciesService {
  return {
    async getNearbyAgencies(query) {
      await wait(options.delayMs ?? 250);

      if (!query.caseId.trim()) {
        throw new NearbyAgenciesServiceError(
          "INVALID_CASE_ID",
          "활성 사건을 확인할 수 없습니다.",
        );
      }

      if (!isValidLocation(query)) {
        throw new NearbyAgenciesServiceError(
          "INVALID_LOCATION",
          "현재 위치를 확인할 수 없습니다.",
        );
      }

      if (options.failLoad) {
        throw new NearbyAgenciesServiceError(
          "NETWORK_ERROR",
          "주변 기관을 불러오지 못했습니다.",
        );
      }

      const agencies = options.empty
        ? []
        : nearbyAgencyFixtures.map((agency) => ({ ...agency }));

      return {
        referenceLocation: { ...query.location },
        agencies,
        fetchedAt: new Date().toISOString(),
      } satisfies NearbyAgenciesResult;
    },
  };
}
