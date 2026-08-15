import { NextResponse } from "next/server";
import { authorizeCaseRequest } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const modes = { WALK: "WALK", TRANSIT: "TRANSIT", DRIVE: "DRIVE" } as const;

type GoogleRouteStep = {
  travelMode?: string;
  distanceMeters?: number;
  staticDuration?: string;
  navigationInstruction?: { instructions?: string };
  transitDetails?: {
    headsign?: string;
    stopCount?: number;
    stopDetails?: { departureStop?: { name?: string }; arrivalStop?: { name?: string } };
    transitLine?: { name?: string; nameShort?: string; vehicle?: { type?: string } };
  };
};

export type TransitStepDto = {
  order: number;
  type: "WALK" | "TRANSIT";
  instruction?: string;
  distanceMeters?: number;
  durationSeconds?: number;
  departureStop?: string;
  arrivalStop?: string;
  lineName?: string;
  vehicleType?: string;
  stopCount?: number;
  headsign?: string;
};

function durationSeconds(duration: unknown) {
  if (typeof duration !== "string") return undefined;
  const value = Number.parseFloat(duration);
  return Number.isFinite(value) ? value : undefined;
}

/** Maps only fields returned by Google Routes into the client-facing transit DTO. */
export function normalizeTransitSteps(legs: { steps?: GoogleRouteStep[] }[] | undefined): TransitStepDto[] | undefined {
  const steps = legs?.flatMap((leg) => leg.steps ?? []) ?? [];
  const transitSteps = steps.flatMap((step, index) => {
    if (step.travelMode !== "WALK" && step.travelMode !== "TRANSIT") return [];
    const details = step.transitDetails;
    const result: TransitStepDto = { order: index + 1, type: step.travelMode };
    if (typeof step.navigationInstruction?.instructions === "string") result.instruction = step.navigationInstruction.instructions;
    if (typeof step.distanceMeters === "number") result.distanceMeters = step.distanceMeters;
    const seconds = durationSeconds(step.staticDuration);
    if (seconds !== undefined) result.durationSeconds = seconds;
    if (step.travelMode === "TRANSIT") {
      if (typeof details?.stopDetails?.departureStop?.name === "string") result.departureStop = details.stopDetails.departureStop.name;
      if (typeof details?.stopDetails?.arrivalStop?.name === "string") result.arrivalStop = details.stopDetails.arrivalStop.name;
      const lineName = details?.transitLine?.nameShort ?? details?.transitLine?.name;
      if (typeof lineName === "string") result.lineName = lineName;
      if (typeof details?.transitLine?.vehicle?.type === "string") result.vehicleType = details.transitLine.vehicle.type;
      if (typeof details?.stopCount === "number") result.stopCount = details.stopCount;
      if (typeof details?.headsign === "string") result.headsign = details.headsign;
    }
    return [result];
  });
  return transitSteps.length > 0 ? transitSteps : undefined;
}

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const access = await authorizeCaseRequest(request, id);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
  if (!key) return NextResponse.json({ success: false, error: "MAPS_NOT_CONFIGURED" }, { status: 503 });
  let body: any;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "INVALID_JSON" }, { status: 400 }); }
  const mode = modes[body?.travelMode as keyof typeof modes];
  const valid = (point: any) => Number.isFinite(point?.latitude) && Number.isFinite(point?.longitude) && point.latitude >= -90 && point.latitude <= 90 && point.longitude >= -180 && point.longitude <= 180;
  if (!mode || !valid(body?.origin) || !valid(body?.destination)) return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });
  const origin = { latitude: body.origin.latitude, longitude: body.origin.longitude };
  const destination = { latitude: body.destination.latitude, longitude: body.destination.longitude };
  let response: Response;
  try {
    const fieldMask = mode === "TRANSIT"
      ? "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.travelMode,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.transitDetails.stopDetails.departureStop.name,routes.legs.steps.transitDetails.stopDetails.arrivalStop.name,routes.legs.steps.transitDetails.transitLine.name,routes.legs.steps.transitDetails.transitLine.nameShort,routes.legs.steps.transitDetails.transitLine.vehicle.type,routes.legs.steps.transitDetails.stopCount,routes.legs.steps.transitDetails.headsign"
      : "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline";
    response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask }, body: JSON.stringify({ origin: { location: { latLng: origin } }, destination: { location: { latLng: destination } }, travelMode: mode }) });
  } catch {
    return NextResponse.json({ success: false, error: "ROUTE_UNAVAILABLE" }, { status: 502 });
  }
  if (!response.ok) {
    const upstream = await response.text();
    console.error("Google Routes request failed", { status: response.status, upstream });
    return NextResponse.json({ success: false, error: "ROUTE_UNAVAILABLE" }, { status: 502 });
  }
  const result: any = await response.json(); const route = result.routes?.[0];
  if (!route) return NextResponse.json({ success: false, error: "ROUTE_NOT_FOUND" }, { status: 404 });
  const transitSteps = mode === "TRANSIT" ? normalizeTransitSteps(route.legs) : undefined;
  return NextResponse.json({ success: true, data: { distanceMeters: route.distanceMeters, duration: route.duration, polyline: route.polyline?.encodedPolyline ?? null, ...(transitSteps ? { transitSteps } : {}) } });
}
