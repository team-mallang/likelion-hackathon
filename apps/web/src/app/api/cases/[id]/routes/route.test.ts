import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createCaseAccessToken } from "@/lib/auth";

import { normalizeTransitSteps, POST } from "./route";

const originalFetch = globalThis.fetch;
const originalAuthSecret = process.env.AUTH_SECRET;
const originalGoogleMapsKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;

afterEach(() => {
  globalThis.fetch = originalFetch;

  if (originalAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = originalAuthSecret;

  if (originalGoogleMapsKey === undefined) delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
  else process.env.GOOGLE_MAPS_SERVER_API_KEY = originalGoogleMapsKey;
});

test("Routes request sends only latitude and longitude to Google", async () => {
  process.env.AUTH_SECRET = "test-auth-secret-for-routes";
  process.env.GOOGLE_MAPS_SERVER_API_KEY = "test-google-maps-key";
  const accessToken = await createCaseAccessToken("case_1");
  let upstreamBody: Record<string, unknown> | undefined;

  globalThis.fetch = async (_input, init) => {
    upstreamBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({
      routes: [{ distanceMeters: 2300, duration: "420s", polyline: { encodedPolyline: "" } }],
    }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const response = await POST(new Request("http://localhost/api/cases/case_1/routes", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      origin: { latitude: 37.554, longitude: 126.936, accuracyMeters: 12 },
      destination: { latitude: 37.551, longitude: 126.935, accuracyMeters: 8 },
      travelMode: "WALK",
    }),
  }), { params: Promise.resolve({ id: "case_1" }) });

  assert.equal(response.status, 200);
  assert.deepEqual(upstreamBody, {
    origin: { location: { latLng: { latitude: 37.554, longitude: 126.936 } } },
    destination: { location: { latLng: { latitude: 37.551, longitude: 126.935 } } },
    travelMode: "WALK",
    computeAlternativeRoutes: true,
  });
});

test("returns every route received from Google", async () => {
  process.env.AUTH_SECRET = "test-auth-secret-for-routes";
  process.env.GOOGLE_MAPS_SERVER_API_KEY = "test-google-maps-key";
  const accessToken = await createCaseAccessToken("case_1");

  globalThis.fetch = async () => new Response(JSON.stringify({
    routes: [
      { distanceMeters: 2300, duration: "420s", polyline: { encodedPolyline: "primary" } },
      { distanceMeters: 2500, duration: "480s", polyline: { encodedPolyline: "alternative" } },
    ],
  }), { status: 200, headers: { "content-type": "application/json" } });

  const response = await POST(new Request("http://localhost/api/cases/case_1/routes", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      origin: { latitude: 37.554, longitude: 126.936 },
      destination: { latitude: 37.551, longitude: 126.935 },
      travelMode: "WALK",
    }),
  }), { params: Promise.resolve({ id: "case_1" }) });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: {
      routes: [
        { routeId: "route-0", routePreference: "DEFAULT", distanceMeters: 2300, duration: "420s", polyline: "primary" },
        { routeId: "route-1", routePreference: "DEFAULT", distanceMeters: 2500, duration: "480s", polyline: "alternative" },
      ],
      meta: { routeCount: 2, googleRequestCount: 1, alternativesRequested: true },
    },
  });
});

test("requests transit schedule, headway, and line fields", async () => {
  process.env.AUTH_SECRET = "test-auth-secret-for-routes";
  process.env.GOOGLE_MAPS_SERVER_API_KEY = "test-google-maps-key";
  const accessToken = await createCaseAccessToken("case_1");
  let upstreamBody: Record<string, unknown> | undefined;
  let fieldMask = "";
  const routingPreferences: unknown[] = [];

  globalThis.fetch = async (_input, init) => {
    upstreamBody = JSON.parse(String(init?.body));
    routingPreferences.push((upstreamBody?.transitPreferences as { routingPreference?: unknown } | undefined)?.routingPreference);
    fieldMask = new Headers(init?.headers).get("X-Goog-FieldMask") ?? "";
    return new Response(JSON.stringify({ routes: [{ legs: [] }] }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const response = await POST(new Request("http://localhost/api/cases/case_1/routes", {
    method: "POST",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({
      origin: { latitude: 37.554, longitude: 126.936 },
      destination: { latitude: 37.551, longitude: 126.935 },
      travelMode: "TRANSIT",
    }),
  }), { params: Promise.resolve({ id: "case_1" }) });

  assert.equal(response.status, 200);
  assert.equal(upstreamBody?.computeAlternativeRoutes, true);
  assert.equal(typeof upstreamBody?.departureTime, "string");
  assert.deepEqual(routingPreferences, [undefined, "FEWER_TRANSFERS", "LESS_WALKING"]);
  assert.match(fieldMask, /transitDetails\.stopDetails\.departureTime/);
  assert.match(fieldMask, /transitDetails\.stopDetails\.arrivalTime/);
  assert.match(fieldMask, /transitDetails\.localizedValues\.departureTime\.time\.text/);
  assert.match(fieldMask, /transitDetails\.headway/);
  assert.match(fieldMask, /transitDetails\.tripShortText/);
  assert.match(fieldMask, /transitLine\.agencies\.name/);
});

test("normalizes WALK plus TRANSIT detail steps", () => {
  assert.deepEqual(normalizeTransitSteps([{ steps: [
    { travelMode: "WALK", distanceMeters: 300, staticDuration: "240s", navigationInstruction: { instructions: "Walk" } },
    { travelMode: "TRANSIT", staticDuration: "600s", transitDetails: { stopDetails: { departureStop: { name: "Board" }, arrivalStop: { name: "Exit" } }, transitLine: { nameShort: "6", vehicle: { type: "SUBWAY" } }, stopCount: 2, headsign: "Terminus" } },
  ] }]), [
    { order: 1, type: "WALK", instruction: "Walk", distanceMeters: 300, durationSeconds: 240 },
    { order: 2, type: "TRANSIT", durationSeconds: 600, departureStop: "Board", arrivalStop: "Exit", lineName: "6", vehicleType: "SUBWAY", stopCount: 2, headsign: "Terminus" },
  ]);
});

test("keeps a transit step when optional Google details are unavailable", () => {
  assert.deepEqual(normalizeTransitSteps([{ steps: [{ travelMode: "TRANSIT", transitDetails: {} }] }]), [{ order: 1, type: "TRANSIT" }]);
});

test("normalizes transit schedule, headway, and line identification", () => {
  assert.deepEqual(normalizeTransitSteps([{ steps: [{
    travelMode: "TRANSIT",
    polyline: { encodedPolyline: "step-polyline" },
    startLocation: { latLng: { latitude: 37.5, longitude: 126.9 } },
    endLocation: { latLng: { latitude: 37.6, longitude: 127 } },
    transitDetails: {
      stopDetails: {
        departureStop: { name: "Board" },
        arrivalStop: { name: "Exit" },
        departureTime: "2026-08-17T06:10:00Z",
        arrivalTime: "2026-08-17T06:30:00Z",
      },
      localizedValues: {
        departureTime: { time: { text: "오후 3:10" }, timeZone: "Asia/Seoul" },
        arrivalTime: { time: { text: "오후 3:30" }, timeZone: "Asia/Seoul" },
      },
      headway: "600s",
      tripShortText: "761-42",
      transitLine: { nameShort: "761", agencies: [{ name: "서울버스" }], vehicle: { type: "BUS" } },
    },
  }] }]), [{
    order: 1,
    type: "TRANSIT",
    polyline: "step-polyline",
    startLocation: { latitude: 37.5, longitude: 126.9 },
    endLocation: { latitude: 37.6, longitude: 127 },
    departureStop: "Board",
    arrivalStop: "Exit",
    lineName: "761",
    vehicleType: "BUS",
    departureTime: "2026-08-17T06:10:00Z",
    arrivalTime: "2026-08-17T06:30:00Z",
    localizedDepartureTime: "오후 3:10",
    localizedArrivalTime: "오후 3:30",
    departureTimeZone: "Asia/Seoul",
    arrivalTimeZone: "Asia/Seoul",
    headwaySeconds: 600,
    tripShortText: "761-42",
    agencyName: "서울버스",
  }]);
});
