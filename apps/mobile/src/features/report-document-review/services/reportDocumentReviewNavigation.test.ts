import assert from "node:assert/strict";
import test from "node:test";

import { reportDocumentReviewNavigationState } from "./reportDocumentReviewNavigation";

test("S15 to S16 navigation carries only an opaque review session ID", () => {
  reportDocumentReviewNavigationState.clearTarget();
  reportDocumentReviewNavigationState.setTarget({ sessionId: "opaque-review-1", source: "S15_REPORT_PHOTO" });
  assert.deepEqual(reportDocumentReviewNavigationState.target, { sessionId: "opaque-review-1", source: "S15_REPORT_PHOTO" });
  assert.equal("uri" in (reportDocumentReviewNavigationState.target ?? {}), false);
  assert.equal("base64" in (reportDocumentReviewNavigationState.target ?? {}), false);
  reportDocumentReviewNavigationState.clearTarget();
  assert.equal(reportDocumentReviewNavigationState.target, null);
});
