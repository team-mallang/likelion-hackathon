import assert from "node:assert/strict";
import test from "node:test";

import { createMockReportPhotoCaptureService, createMockReportPhotoExportService } from "./mockReportPhoto";
import { ReportPhotoExportError } from "./reportPhotoExport";

test("S15 mock capture keeps photo data session-only", async () => {
  const photo = await createMockReportPhotoCaptureService().capture();
  assert.equal(photo.mimeType, "image/jpeg");
  assert.match(photo.uri, /^mock:\/\//);
});

test("S15 stage-1 export mock does not pretend OS storage is connected", async () => {
  await assert.rejects(
    createMockReportPhotoExportService().saveOrShare({ uri: "mock://photo" }),
    (error: unknown) => error instanceof ReportPhotoExportError && error.code === "EXPORT_NOT_SUPPORTED",
  );
});
