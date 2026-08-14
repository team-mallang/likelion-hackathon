import assert from "node:assert/strict";
import { test } from "node:test";

import { getDirectionsMapData } from "./directionsMapData";

test("keeps base map coordinates available when route guidance is unavailable", () => {
  const origin = { latitude: 37.554, longitude: 126.936, accuracyMeters: 12 };
  const destination = { agencyId: "agency_1", name: "Seoul Seobu Police Station", address: "Mapo-gu", latitude: 37.551, longitude: 126.935 };

  assert.deepEqual(getDirectionsMapData({ origin, destination, guidance: null }), { origin, destination });
});
