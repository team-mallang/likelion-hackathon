import assert from "node:assert/strict";
import test from "node:test";

import { documentScanNavigationState } from "./documentScanNavigation";

test("S10 to S09 navigation carries only an opaque scan job ID", () => {
  documentScanNavigationState.clearTarget();
  documentScanNavigationState.setTarget({ scanJobId: "opaque-scan-job-1" });

  assert.deepEqual(documentScanNavigationState.target, {
    scanJobId: "opaque-scan-job-1",
  });
  assert.equal("imageUri" in (documentScanNavigationState.target ?? {}), false);

  documentScanNavigationState.clearTarget();
  assert.equal(documentScanNavigationState.target, null);
});
