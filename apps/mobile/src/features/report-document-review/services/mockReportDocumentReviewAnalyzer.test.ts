import assert from "node:assert/strict";
import test from "node:test";

import { createMockReportDocumentReviewAnalyzer } from "./mockReportDocumentReview";

test("S16 mock analyzer supports missing and low-confidence fields", async () => {
  const fields = await createMockReportDocumentReviewAnalyzer({ fields: [{ key: "incidentNumber", label: "접수 번호", value: "", confidence: "LOW", editable: true, required: true }] }).analyze({ uri: "file://report.jpg" });
  assert.equal(fields[0]?.value, "");
  assert.equal(fields[0]?.confidence, "LOW");
});

test("S16 mock analyzer returns a safe failure", async () => {
  await assert.rejects(() => createMockReportDocumentReviewAnalyzer({ fail: true }).analyze({ uri: "file://report.jpg" }), { code: "REVIEW_FAILED" });
});
