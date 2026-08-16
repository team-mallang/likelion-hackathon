import type { TransitRouteStep } from "@/features/directions/types/directions";

export function formatTransitStepDuration(seconds: number | undefined) {
  return typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0
    ? `${Math.ceil(seconds / 60)}분`
    : undefined;
}

export function formatTransitStepDistance(meters: number | undefined) {
  return typeof meters === "number" && Number.isFinite(meters) && meters >= 0
    ? (meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`)
    : undefined;
}

export function transitStepIcon(step: TransitRouteStep) {
  if (step.type === "WALK") return "walk" as const;
  if (step.vehicleType === "BUS" || step.vehicleType === "INTERCITY_BUS" || step.vehicleType === "TROLLEYBUS") return "bus" as const;
  if (step.vehicleType === "SUBWAY" || step.vehicleType === "METRO_RAIL") return "subway" as const;
  return "train" as const;
}

export function transitStepSummary(step: TransitRouteStep) {
  const duration = formatTransitStepDuration(step.durationSeconds);
  const distance = formatTransitStepDistance(step.distanceMeters);
  return [duration, distance].filter(Boolean).join(" · ");
}

export function transitStepDepartureTime(step: TransitRouteStep) {
  return step.localizedDepartureTime ?? formatTimestamp(step.departureTime, step.departureTimeZone);
}

export function transitStepArrivalTime(step: TransitRouteStep) {
  return step.localizedArrivalTime ?? formatTimestamp(step.arrivalTime, step.arrivalTimeZone);
}

export function transitStepWaitTime(step: TransitRouteStep, nowMs = Date.now()) {
  if (!step.departureTime) return undefined;
  const departureMs = Date.parse(step.departureTime);
  if (!Number.isFinite(departureMs) || departureMs < nowMs) return undefined;
  const minutes = Math.ceil((departureMs - nowMs) / 60_000);
  return minutes <= 1 ? "곧 출발" : `약 ${minutes}분 후`;
}

export function transitStepHeadway(step: TransitRouteStep) {
  if (typeof step.headwaySeconds !== "number" || !Number.isFinite(step.headwaySeconds) || step.headwaySeconds < 0) return undefined;
  return `배차 간격 약 ${Math.ceil(step.headwaySeconds / 60)}분`;
}

function formatTimestamp(timestamp: string | undefined, timeZone: string | undefined) {
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return undefined;
  try {
    return new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit", ...(timeZone ? { timeZone } : {}) }).format(date);
  } catch {
    return new Intl.DateTimeFormat("ko-KR", { hour: "numeric", minute: "2-digit" }).format(date);
  }
}
