import { NextResponse } from "next/server";

import { authorizeCaseRequest } from "@/lib/auth";
import { findNearbyAgencies, type NearbyAgencyType } from "@/lib/google-maps/nearby-agencies";

type RouteContext = { params: Promise<{ id: string }> };
const supportedTypes: NearbyAgencyType[] = ["POLICE_STATION", "EMBASSY"];

function parseCoordinate(value: string | null) {
  if (value === null || value.trim() === "") return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await authorizeCaseRequest(request, id);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });

  const url = new URL(request.url);
  const latitude = parseCoordinate(url.searchParams.get("latitude"));
  const longitude = parseCoordinate(url.searchParams.get("longitude"));
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json({ success: false, error: "INVALID_LOCATION" }, { status: 400 });
  }

  const types = url.searchParams.getAll("type").filter((type): type is NearbyAgencyType => supportedTypes.includes(type as NearbyAgencyType));
  try {
    const agencies = await findNearbyAgencies({ latitude, longitude }, types);
    return NextResponse.json({ success: true, data: { referenceLocation: { latitude, longitude }, agencies, fetchedAt: new Date().toISOString() } });
  } catch (error) {
    console.error("GET /api/cases/[id]/nearby-agencies error:", error);
    const configured = Boolean(process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim());
    return NextResponse.json({ success: false, error: configured ? "UPSTREAM_ERROR" : "MAPS_NOT_CONFIGURED" }, { status: configured ? 502 : 503 });
  }
}
