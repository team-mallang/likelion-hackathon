import assert from "node:assert/strict";
import test from "node:test";

import { directionsNavigationState } from "./directionsNavigation";

test("S12 to S13 navigation state carries only agencyId and clears on exit", () => {
  directionsNavigationState.clearTarget();
  const target = { agencyId: "agency-1", placeId: "agency-1", name: "Test", address: "Test address", latitude: 35.1, longitude: 139.1, origin: { latitude: 35, longitude: 139 } };
  directionsNavigationState.setTarget(target);
  assert.deepEqual(directionsNavigationState.target, target);
  directionsNavigationState.clearTarget();
  assert.equal(directionsNavigationState.target, null);
});
