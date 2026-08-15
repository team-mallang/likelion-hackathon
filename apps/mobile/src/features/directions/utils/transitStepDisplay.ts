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
