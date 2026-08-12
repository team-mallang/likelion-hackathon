import assert from "node:assert/strict";
import test from "node:test";

import { directionsNavigationState } from "./directionsNavigation";

test("S12 to S13 navigation state carries only agencyId and clears on exit", () => {
  directionsNavigationState.clearTarget();
  directionsNavigationState.setTarget({ agencyId: "agency-1" });
  assert.deepEqual(directionsNavigationState.target, { agencyId: "agency-1" });
  directionsNavigationState.clearTarget();
  assert.equal(directionsNavigationState.target, null);
});
