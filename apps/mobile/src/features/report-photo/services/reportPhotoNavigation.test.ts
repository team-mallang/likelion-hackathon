import assert from "node:assert/strict";
import test from "node:test";

import { reportPhotoNavigationState } from "./reportPhotoNavigation";

test("S15 route state carries only the entry point", () => {
  reportPhotoNavigationState.setTarget({ entryPoint: "S09_REPORT_DRAFT" });
  assert.deepEqual(reportPhotoNavigationState.target, { entryPoint: "S09_REPORT_DRAFT" });
  assert.equal("uri" in (reportPhotoNavigationState.target ?? {}), false);
  reportPhotoNavigationState.clearTarget();
  assert.equal(reportPhotoNavigationState.target, null);
});
