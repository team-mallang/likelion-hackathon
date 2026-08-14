import { NextResponse } from "next/server";
import { authorizeCaseRequest } from "@/lib/auth";

type Context = { params: Promise<{ id: string }> };
const modes = { WALK: "WALK", TRANSIT: "TRANSIT", DRIVE: "DRIVE" } as const;

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
  let response: Response;
  try {
    response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", { method: "POST", headers: { "Content-Type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline" }, body: JSON.stringify({ origin: { location: { latLng: body.origin } }, destination: { location: { latLng: body.destination } }, travelMode: mode }) });
  } catch {
    return NextResponse.json({ success: false, error: "ROUTE_UNAVAILABLE" }, { status: 502 });
  }
  if (!response.ok) return NextResponse.json({ success: false, error: "ROUTE_UNAVAILABLE" }, { status: 502 });
  const result: any = await response.json(); const route = result.routes?.[0];
  if (!route) return NextResponse.json({ success: false, error: "ROUTE_NOT_FOUND" }, { status: 404 });
  return NextResponse.json({ success: true, data: { distanceMeters: route.distanceMeters, duration: route.duration, polyline: route.polyline?.encodedPolyline ?? null } });
}
