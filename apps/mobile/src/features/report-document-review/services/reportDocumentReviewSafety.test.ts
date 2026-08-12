import assert from "node:assert/strict";
import test from "node:test";

import { reportDocumentReviewNavigationState } from "./reportDocumentReviewNavigation";

test("S16 navigation state never carries photo or OCR payloads", () => {
  reportDocumentReviewNavigationState.setTarget({ sessionId: "opaque-review-safety", source: "S15_REPORT_PHOTO" });
  const target = reportDocumentReviewNavigationState.target as Record<string, unknown>;
  assert.equal(Object.keys(target).sort().join(","), "sessionId,source");
  assert.equal("photoUri" in target, false);
  assert.equal("ocrText" in target, false);
  reportDocumentReviewNavigationState.clearTarget();
});
