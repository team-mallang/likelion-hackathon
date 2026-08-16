import { NextResponse } from "next/server";
import { authorizeCaseRequest } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const modes = { WALK: "WALK", TRANSIT: "TRANSIT", DRIVE: "DRIVE" } as const;

type GoogleRouteStep = {
  travelMode?: string;
  distanceMeters?: number;
  staticDuration?: string;
  polyline?: { encodedPolyline?: string };
  startLocation?: { latLng?: { latitude?: number; longitude?: number } };
  endLocation?: { latLng?: { latitude?: number; longitude?: number } };
  navigationInstruction?: { instructions?: string };
  transitDetails?: {
    headsign?: string;
    headway?: string;
    stopCount?: number;
    tripShortText?: string;
    stopDetails?: {
      departureStop?: { name?: string };
      arrivalStop?: { name?: string };
      departureTime?: string;
      arrivalTime?: string;
    };
    localizedValues?: {
      departureTime?: { time?: { text?: string }; timeZone?: string };
      arrivalTime?: { time?: { text?: string }; timeZone?: string };
    };
    transitLine?: {
      name?: string;
      nameShort?: string;
      agencies?: { name?: string }[];
      vehicle?: { type?: string };
    };
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
  departureTime?: string;
  arrivalTime?: string;
  localizedDepartureTime?: string;
  localizedArrivalTime?: string;
  departureTimeZone?: string;
  arrivalTimeZone?: string;
  headwaySeconds?: number;
  tripShortText?: string;
  agencyName?: string;
  polyline?: string;
  startLocation?: { latitude: number; longitude: number };
  endLocation?: { latitude: number; longitude: number };
};

function durationSeconds(duration: unknown) {
  if (typeof duration !== "string") return undefined;
  const value = Number.parseFloat(duration);
  return Number.isFinite(value) ? value : undefined;
}

function routePoint(location: GoogleRouteStep["startLocation"]) {
  const latitude = location?.latLng?.latitude;
  const longitude = location?.latLng?.longitude;
  return typeof latitude === "number" && typeof longitude === "number" ? { latitude, longitude } : undefined;
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
    if (typeof step.polyline?.encodedPolyline === "string") result.polyline = step.polyline.encodedPolyline;
    const startLocation = routePoint(step.startLocation);
    const endLocation = routePoint(step.endLocation);
    if (startLocation) result.startLocation = startLocation;
    if (endLocation) result.endLocation = endLocation;
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
      if (typeof details?.stopDetails?.departureTime === "string") result.departureTime = details.stopDetails.departureTime;
      if (typeof details?.stopDetails?.arrivalTime === "string") result.arrivalTime = details.stopDetails.arrivalTime;
      if (typeof details?.localizedValues?.departureTime?.time?.text === "string") result.localizedDepartureTime = details.localizedValues.departureTime.time.text;
      if (typeof details?.localizedValues?.arrivalTime?.time?.text === "string") result.localizedArrivalTime = details.localizedValues.arrivalTime.time.text;
      if (typeof details?.localizedValues?.departureTime?.timeZone === "string") result.departureTimeZone = details.localizedValues.departureTime.timeZone;
      if (typeof details?.localizedValues?.arrivalTime?.timeZone === "string") result.arrivalTimeZone = details.localizedValues.arrivalTime.timeZone;
      const headwaySeconds = durationSeconds(details?.headway);
      if (headwaySeconds !== undefined) result.headwaySeconds = headwaySeconds;
      if (typeof details?.tripShortText === "string") result.tripShortText = details.tripShortText;
      const agencyName = details?.transitLine?.agencies?.[0]?.name;
      if (typeof agencyName === "string") result.agencyName = agencyName;
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
  const fieldMask = mode === "TRANSIT"
    ? "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.travelMode,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration,routes.legs.steps.polyline.encodedPolyline,routes.legs.steps.startLocation.latLng,routes.legs.steps.endLocation.latLng,routes.legs.steps.navigationInstruction.instructions,routes.legs.steps.transitDetails.stopDetails.departureStop.name,routes.legs.steps.transitDetails.stopDetails.arrivalStop.name,routes.legs.steps.transitDetails.stopDetails.departureTime,routes.legs.steps.transitDetails.stopDetails.arrivalTime,routes.legs.steps.transitDetails.localizedValues.departureTime.time.text,routes.legs.steps.transitDetails.localizedValues.departureTime.timeZone,routes.legs.steps.transitDetails.localizedValues.arrivalTime.time.text,routes.legs.steps.transitDetails.localizedValues.arrivalTime.timeZone,routes.legs.steps.transitDetails.headway,routes.legs.steps.transitDetails.transitLine.name,routes.legs.steps.transitDetails.transitLine.nameShort,routes.legs.steps.transitDetails.transitLine.agencies.name,routes.legs.steps.transitDetails.transitLine.vehicle.type,routes.legs.steps.transitDetails.stopCount,routes.legs.steps.transitDetails.headsign,routes.legs.steps.transitDetails.tripShortText"
    : "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline";
  const departureTime = mode === "TRANSIT" ? new Date().toISOString() : undefined;
  const requestGoogleRoutes = (routingPreference?: "FEWER_TRANSFERS" | "LESS_WALKING") => fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": fieldMask },
    body: JSON.stringify({
      origin: { location: { latLng: origin } },
      destination: { location: { latLng: destination } },
      travelMode: mode,
      computeAlternativeRoutes: true,
      ...(departureTime ? { departureTime } : {}),
      ...(routingPreference ? { transitPreferences: { routingPreference } } : {}),
    }),
  });
  let response: Response;
  try {
    response = await requestGoogleRoutes();
  } catch {
    return NextResponse.json({ success: false, error: "ROUTE_UNAVAILABLE" }, { status: 502 });
  }
  if (!response.ok) {
    const upstream = await response.text();
    console.error("Google Routes request failed", { status: response.status, upstream });
    return NextResponse.json({ success: false, error: "ROUTE_UNAVAILABLE" }, { status: 502 });
  }
  const result: any = await response.json();
  const candidates: { route: any; preference: "DEFAULT" | "FEWER_TRANSFERS" | "LESS_WALKING" }[] = (result.routes ?? []).map((route: any) => ({ route, preference: "DEFAULT" }));
  let googleRequestCount = 1;
  if (mode === "TRANSIT" && candidates.length < 2) {
    for (const preference of ["FEWER_TRANSFERS", "LESS_WALKING"] as const) {
      try {
        const alternativeResponse = await requestGoogleRoutes(preference);
        googleRequestCount += 1;
        if (!alternativeResponse.ok) continue;
        const alternativeResult: any = await alternativeResponse.json();
        candidates.push(...(alternativeResult.routes ?? []).map((route: any) => ({ route, preference })));
      } catch {
        console.warn("Google Routes preference request failed", { mode, preference });
      }
    }
  }
  const seenRoutes = new Set<string>();
  const uniqueCandidates = candidates.filter(({ route }) => {
    const signature = route.polyline?.encodedPolyline ?? `${route.distanceMeters ?? ""}:${route.duration ?? ""}`;
    if (seenRoutes.has(signature)) return false;
    seenRoutes.add(signature);
    return true;
  });
  const routes = uniqueCandidates.map(({ route, preference }, index) => ({
    routeId: `route-${index}`,
    routePreference: preference,
    distanceMeters: route.distanceMeters,
    duration: route.duration,
    polyline: route.polyline?.encodedPolyline ?? null,
    ...(mode === "TRANSIT" ? { transitSteps: normalizeTransitSteps(route.legs) } : {}),
  }));
  if (routes.length === 0) return NextResponse.json({ success: false, error: "ROUTE_NOT_FOUND" }, { status: 404 });
  console.info("Google Routes candidates prepared", { mode, routeCount: routes.length, googleRequestCount });
  return NextResponse.json({ success: true, data: { routes, meta: { routeCount: routes.length, googleRequestCount, alternativesRequested: true } } });
}
