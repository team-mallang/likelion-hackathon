import assert from "node:assert/strict";
import test from "node:test";

import { createMockDocumentScanService } from "./mockDocumentScan";
import { DocumentScanServiceError } from "./documentScan";

test("S10 mock scan returns an opaque job ID and scanned-document source", async () => {
  const service = createMockDocumentScanService({ delayMs: 0 });
  const job = await service.start({ caseId: "case-1" });
  const result = await service.getResult({ caseId: "case-1", scanJobId: job.scanJobId });

  assert.equal(job.status, "QUEUED");
  assert.equal(result.source, "SCANNED_DOCUMENT");
  assert.equal("imageUri" in result, false);
});

test("S10 does not pretend OCR is available when the mock is configured to fail", async () => {
  const service = createMockDocumentScanService({ delayMs: 0, failStart: true });
  await assert.rejects(
    service.start({ caseId: "case-1" }),
    (error: unknown) => error instanceof DocumentScanServiceError && error.code === "ANALYSIS_NOT_CONFIGURED",
  );
});
