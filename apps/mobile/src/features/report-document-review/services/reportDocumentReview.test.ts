import assert from "node:assert/strict";
import test from "node:test";

import { createMockReportDocumentReviewService } from "./mockReportDocumentReview";
import { hasRequiredReviewFields } from "./reportDocumentReview";

test("S15 photo is kept behind an opaque S16 review session", async () => {
  const service = createMockReportDocumentReviewService();
  const { sessionId } = await service.createSession({ source: "S15_REPORT_PHOTO", photo: { uri: "file://private-report.jpg" } });
  const review = await service.getReview(sessionId);

  assert.match(sessionId, /^mock-review-/);
  assert.equal(review.photoAvailable, true);
  assert.equal("photoUri" in review, false);
  assert.equal(review.status, "REVIEW_REQUIRED");
  assert.deepEqual(await service.getPhoto(sessionId), { uri: "file://private-report.jpg" });
});

test("S16 field edits make a complete review ready for the documents tab", async () => {
  const service = createMockReportDocumentReviewService({ fields: [
    { key: "incidentNumber", label: "접수 번호", value: "", confidence: "LOW", editable: true, required: true },
  ] });
  const { sessionId } = await service.createSession({ source: "S15_REPORT_PHOTO", photo: { uri: "file://private-report.jpg" } });
  assert.equal(hasRequiredReviewFields((await service.getReview(sessionId)).fields), false);
  const updated = await service.updateField(sessionId, "incidentNumber", "JPD-1");
  assert.equal(updated.status, "READY_FOR_DOCUMENTS");
});

test("S16 clears an expired session", async () => {
  const service = createMockReportDocumentReviewService();
  const { sessionId } = await service.createSession({ source: "S15_REPORT_PHOTO", photo: { uri: "file://private-report.jpg" } });
  service.clearSession(sessionId);
  await assert.rejects(() => service.getReview(sessionId), { code: "SESSION_NOT_FOUND" });
});
