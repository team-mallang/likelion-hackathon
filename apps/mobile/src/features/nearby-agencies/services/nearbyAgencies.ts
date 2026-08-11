import type {
  NearbyAgenciesQuery,
  NearbyAgenciesResult,
} from "@/features/nearby-agencies/types/nearbyAgencies";

export type NearbyAgenciesServiceErrorCode =
  | "INVALID_CASE_ID"
  | "INVALID_LOCATION"
  | "LOCATION_REQUIRED"
  | "AGENCIES_NOT_FOUND"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class NearbyAgenciesServiceError extends Error {
  constructor(
    public readonly code: NearbyAgenciesServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "NearbyAgenciesServiceError";
  }
}

export type NearbyAgenciesService = {
  getNearbyAgencies(
    query: NearbyAgenciesQuery,
  ): Promise<NearbyAgenciesResult>;
};
