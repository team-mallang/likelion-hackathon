import assert from "node:assert/strict";
import { test } from "node:test";

import { attachmentFileName, sanitizeExportName } from "./exportArchiveModel";

test("sanitizeExportName keeps only filesystem-safe ASCII characters", () => {
  assert.equal(sanitizeExportName("CASE/東京 001"), "CASE____001");
  assert.equal(sanitizeExportName("!!!"), "case");
});

test("attachment filenames are numbered and use safe image extensions", () => {
  assert.equal(attachmentFileName(1, "receipt.original.jpeg", "image/jpeg"), "attachment-001.jpg");
  assert.equal(attachmentFileName(12, "scan.bin", "image/png"), "attachment-012.png");
  assert.equal(attachmentFileName(2, "unknown.bin", "application/octet-stream"), "attachment-002.jpg");
});
