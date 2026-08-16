import assert from "node:assert/strict";
import { test } from "node:test";

import { parseEvidenceIndex } from "./localEvidenceModel";

const item = {
  id: "evidence-1",
  caseId: "case-a",
  uri: "file:///evidence-1.jpg",
  documentType: "경찰 발급 서류",
  createdAt: "2026-08-17T00:00:00.000Z",
  fileName: "evidence-1.jpg",
  mimeType: "image/jpeg",
};

test("evidence index restores valid entries and preserves case ownership", () => {
  assert.deepEqual(parseEvidenceIndex(JSON.stringify({ version: 1, items: [item] })), {
    version: 1,
    items: [item],
  });
});

test("evidence index ignores malformed or stale metadata", () => {
  assert.deepEqual(parseEvidenceIndex(JSON.stringify({ version: 1, items: [item, { ...item, caseId: null }, "invalid"] })), {
    version: 1,
    items: [item],
  });
  assert.deepEqual(parseEvidenceIndex("not-json"), { version: 1, items: [] });
});
