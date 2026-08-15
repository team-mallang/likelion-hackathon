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
  });
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
