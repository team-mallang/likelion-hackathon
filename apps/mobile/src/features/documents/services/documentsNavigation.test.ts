import assert from "node:assert/strict";
import test from "node:test";

import { documentsNavigationState } from "./documentsNavigation";

test("S13 police support remains the return target after replace navigation to S07", () => {
  documentsNavigationState.clearReturnTarget();
  documentsNavigationState.setReturnTarget("POLICE_SUPPORT");

  assert.equal(documentsNavigationState.returnTarget, "POLICE_SUPPORT");
  assert.equal(
    documentsNavigationState.consumeReturnTarget(),
    "POLICE_SUPPORT",
  );
  assert.equal(documentsNavigationState.returnTarget, null);
});
