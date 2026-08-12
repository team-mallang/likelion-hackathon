import type {
  DirectionsQuery,
  RouteGuidance,
} from "@/features/directions/types/directions";

export type DirectionsServiceErrorCode =
  | "INVALID_CASE_ID"
  | "DESTINATION_NOT_FOUND"
  | "LOCATION_REQUIRED"
  | "ROUTE_NOT_FOUND"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class DirectionsServiceError extends Error {
  constructor(
    public readonly code: DirectionsServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DirectionsServiceError";
  }
}

export type DirectionsService = {
  getRoute(query: DirectionsQuery): Promise<RouteGuidance>;
};
