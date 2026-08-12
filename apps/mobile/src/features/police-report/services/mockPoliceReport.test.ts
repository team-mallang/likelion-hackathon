import assert from "node:assert/strict";
import test from "node:test";

import { createMockPoliceReportService } from "./mockPoliceReport";
import { PoliceReportServiceError } from "./policeReport";

test("S09 draft preserves matching Japanese and Korean field pairs", async () => {
  const service = createMockPoliceReportService({ delayMs: 0 });
  const draft = await service.getOrCreateDraft({ caseId: "case-s09" });

  assert.equal(draft.status, "READY");
  assert.equal(draft.missingFieldIds.length, 0);
  assert.equal(draft.applicantFields[0]?.label.ja, "氏名");
  assert.equal(draft.applicantFields[0]?.label.ko, "성명");
  assert.notEqual(draft.incidentFields[0]?.value.ja, "");
  assert.notEqual(draft.incidentFields[0]?.value.ko, "");
  assert.equal(draft.narrative.ja.length > 0, true);
  assert.equal(draft.narrative.ko.length > 0, true);
});

test("S09 missing required information blocks export", async () => {
  const service = createMockPoliceReportService({
    delayMs: 0,
    missingRequiredFields: true,
  });
  const draft = await service.getOrCreateDraft({ caseId: "case-missing" });

  assert.deepEqual(draft.missingFieldIds, [
    "applicant-contact",
    "incident-location",
  ]);

  await assert.rejects(
    () =>
      service.createExport({
        caseId: draft.caseId,
        draftId: draft.draftId,
        version: draft.version,
      }),
    (error: unknown) =>
      error instanceof PoliceReportServiceError &&
      error.code === "REQUIRED_INFORMATION_MISSING",
  );
});

test("S09 stale draft regenerates only with its source revision", async () => {
  const service = createMockPoliceReportService({ delayMs: 0, staleDraft: true });
  const staleDraft = await service.getOrCreateDraft({ caseId: "case-stale" });

  assert.equal(staleDraft.status, "STALE");

  await assert.rejects(
    () =>
      service.regenerateDraft({
        caseId: staleDraft.caseId,
        draftId: staleDraft.draftId,
        sourceRevision: "unexpected-revision",
      }),
    (error: unknown) =>
      error instanceof PoliceReportServiceError &&
      error.code === "SOURCE_REVISION_MISMATCH",
  );

  const regenerated = await service.regenerateDraft({
    caseId: staleDraft.caseId,
    draftId: staleDraft.draftId,
    sourceRevision: staleDraft.sourceRevision,
  });

  assert.equal(regenerated.status, "READY");
  assert.equal(regenerated.version, staleDraft.version + 1);
  assert.notEqual(regenerated.sourceRevision, staleDraft.sourceRevision);
});
