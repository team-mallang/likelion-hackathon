import { Platform } from "react-native";

import type { NearbyAgenciesQuery, NearbyAgenciesResult } from "@/features/nearby-agencies/types/nearbyAgencies";

import { NearbyAgenciesServiceError, type NearbyAgenciesService } from "./nearbyAgencies";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function getApiUrl(path: string) {
  if (configuredBaseUrl) return `${configuredBaseUrl}${path}`;
  if (Platform.OS === "web") return path;
  throw new NearbyAgenciesServiceError("NETWORK_ERROR", "Mobile API URL is not configured.");
}

function isAgency(value: unknown): value is NearbyAgenciesResult["agencies"][number] {
  if (!value || typeof value !== "object") return false;
  const agency = value as Record<string, unknown>;
  return typeof agency.agencyId === "string" && typeof agency.name === "string" && typeof agency.address === "string" && typeof agency.latitude === "number" && typeof agency.longitude === "number";
}

export const apiNearbyAgenciesService: NearbyAgenciesService = {
  async getNearbyAgencies(query) {
    if (!query.caseId.trim()) throw new NearbyAgenciesServiceError("INVALID_CASE_ID", "Active case is required.");
    if (!Number.isFinite(query.location.latitude) || !Number.isFinite(query.location.longitude)) throw new NearbyAgenciesServiceError("INVALID_LOCATION", "Current location is required.");

    const params = new URLSearchParams({ latitude: String(query.location.latitude), longitude: String(query.location.longitude) });
    for (const type of query.types ?? ["POLICE_STATION", "EMBASSY"]) params.append("type", type);
    let response: Response;
    try {
      response = await fetch(getApiUrl(`/api/cases/${encodeURIComponent(query.caseId)}/nearby-agencies?${params}`), {
        headers: query.accessToken ? { Authorization: `Bearer ${query.accessToken}` } : undefined,
      });
    } catch (error) {
      if (error instanceof NearbyAgenciesServiceError) throw error;
      throw new NearbyAgenciesServiceError("NETWORK_ERROR", "Could not load nearby agencies.");
    }

    let body: unknown;
    try { body = await response.json(); } catch { throw new NearbyAgenciesServiceError("INVALID_RESPONSE", "Invalid nearby agencies response.", response.status); }
    if (!response.ok) {
      const error = body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "NETWORK_ERROR";
      const code = error === "INVALID_LOCATION" ? "INVALID_LOCATION" : error === "MAPS_NOT_CONFIGURED" ? "NETWORK_ERROR" : "NETWORK_ERROR";
      throw new NearbyAgenciesServiceError(code, error, response.status);
    }
    const data = body && typeof body === "object" && "data" in body ? body.data : null;
    if (!data || typeof data !== "object") throw new NearbyAgenciesServiceError("INVALID_RESPONSE", "Invalid nearby agencies response.", response.status);
    const result = data as Partial<NearbyAgenciesResult>;
    if (!result.referenceLocation || !Array.isArray(result.agencies) || !result.agencies.every(isAgency) || typeof result.fetchedAt !== "string") throw new NearbyAgenciesServiceError("INVALID_RESPONSE", "Invalid nearby agencies response.", response.status);
    return result as NearbyAgenciesResult;
  },
};
