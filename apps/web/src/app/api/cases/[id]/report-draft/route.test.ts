import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { prisma } from "@project/db";

import { mergePoliceReportDraftEdits, readSavedEdits, saveEdits } from "./route";

const documents = prisma.document as unknown as {
  findFirst: (args: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
};
const originalFindFirst = documents.findFirst;
const originalCreate = documents.create;
const originalUpdate = documents.update;

afterEach(() => {
  documents.findFirst = originalFindFirst;
  documents.create = originalCreate;
  documents.update = originalUpdate;
});

test("report-draft edits create a POLICE_REPORT Document without changing Case data", async () => {
  let created: Record<string, unknown> | undefined;
  documents.findFirst = async () => null;
  documents.create = async (args) => {
    created = (args as { data: Record<string, unknown> }).data;
    return { id: "document-1" };
  };

  await saveEdits("case-1", [{ key: "last_seen_place", valueKo: "Cafe" }]);
  assert.equal(created?.caseId, "case-1");
  assert.equal(created?.type, "POLICE_REPORT");
  assert.deepEqual(created?.extractedData, {
    kind: "POLICE_REPORT_DRAFT_EDITS",
    version: 1,
    edits: [{ key: "last_seen_place", valueKo: "Cafe" }],
  });
});

test("report-draft edits update the existing POLICE_REPORT Document", async () => {
  let updated: Record<string, unknown> | undefined;
  documents.findFirst = async () => ({
    id: "document-1",
    extractedData: {
      kind: "POLICE_REPORT_DRAFT_EDITS",
      version: 1,
      edits: [{ key: "last_seen_place", valueKo: "Cafe" }],
    },
  });
  documents.update = async (args) => {
    updated = (args as { data: Record<string, unknown> }).data;
    return { id: "document-1" };
  };

  await saveEdits("case-1", [{ key: "statement", valueKo: "Updated" }]);
  assert.deepEqual(updated?.extractedData, {
    kind: "POLICE_REPORT_DRAFT_EDITS",
    version: 1,
    edits: [
      { key: "last_seen_place", valueKo: "Cafe" },
      { key: "statement", valueKo: "Updated" },
    ],
  });
});

test("new edit replaces an existing value with the same key", () => {
  assert.deepEqual(
    mergePoliceReportDraftEdits(
      [{ key: "item_0_color", valueKo: "검정" }],
      [{ key: "item_0_color", valueKo: "파랑" }],
    ),
    [{ key: "item_0_color", valueKo: "파랑" }],
  );
});

test("successive saves retain prior edits and add new keys", async () => {
  let stored: Record<string, unknown> = {
    kind: "POLICE_REPORT_DRAFT_EDITS",
    version: 1,
    edits: [{ key: "last_seen_place", valueKo: "신주쿠 카페" }],
  };
  documents.findFirst = async () => ({ id: "document-1", extractedData: stored });
  documents.update = async (args) => {
    stored = (args as { data: { extractedData: Record<string, unknown> } }).data.extractedData;
    return { id: "document-1" };
  };

  await saveEdits("case-1", [{ key: "item_0_brand", valueKo: "Apple" }]);
  assert.deepEqual(stored.edits, [
    { key: "last_seen_place", valueKo: "신주쿠 카페" },
    { key: "item_0_brand", valueKo: "Apple" },
  ]);
});

test("readSavedEdits returns only schema-valid persisted edits", async () => {
  documents.findFirst = async () => ({
    extractedData: {
      kind: "POLICE_REPORT_DRAFT_EDITS",
      version: 1,
      edits: [{ key: "statement", valueKo: "Saved" }],
    },
  });
  assert.deepEqual(await readSavedEdits("case-1"), [
    { key: "statement", valueKo: "Saved" },
  ]);
});
