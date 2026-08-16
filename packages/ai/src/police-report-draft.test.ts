import assert from "node:assert/strict";
import test from "node:test";

import {
  buildPoliceReportDraftBase,
  filterValidPoliceReportDraftEdits,
  type ReportCaseSource,
} from "./police-report-draft";

function source(overrides: Partial<ReportCaseSource["items"][number]> = {}): ReportCaseSource {
  return {
    id: "case-1",
    type: "LOST",
    initialStatement: "Lost an item.",
    lastSeenAt: new Date("2026-08-16T09:30:00.000Z"),
    lastSeenPlace: "Cafe",
    discoveredAt: null,
    discoveredPlace: null,
    estimatedOccurredAt: null,
    estimatedOccurredPlace: null,
    routeAfterLastSeen: null,
    storageState: null,
    description: null,
    items: [{
      id: "item-1", name: "Wallet", category: null, quantity: 1,
      brand: null, model: null, color: null, description: null,
      identifyingFeature: null, unauthorizedTransactionOccurred: null,
      phoneCaseDescription: null, findMyDeviceAvailable: null, shape: null,
      contentsDescription: null, passportDocumentType: null,
      passportNumberKnown: null, departureAt: null, cashAmount: null,
      currency: null, lastSeenAt: null, lastSeenPlace: null,
      ...overrides,
    }],
  };
}

function itemValue(draft: ReturnType<typeof buildPoliceReportDraftBase>, key: string) {
  return draft.sections.find((section) => section.key === "items")?.fields
    .find((field) => field.key === key)?.valueKo;
}

test("item last-seen fields prefer the CaseItem values", () => {
  const draft = buildPoliceReportDraftBase(source({
    lastSeenAt: new Date("2026-08-16T08:00:00.000Z"),
    lastSeenPlace: "Station",
  }));
  assert.equal(itemValue(draft, "item_1_last_seen_place"), "Station");
  assert.equal(itemValue(draft, "item_1_last_seen_at"), "2026-08-16T08:00:00.000Z");
});

test("item last-seen fields fall back to Case values", () => {
  const draft = buildPoliceReportDraftBase(source());
  assert.equal(itemValue(draft, "item_1_last_seen_place"), "Cafe");
  assert.equal(itemValue(draft, "item_1_last_seen_at"), "2026-08-16T09:30:00.000Z");
});

test("item last-seen fields remain null when neither source has a value", () => {
  const draft = buildPoliceReportDraftBase({
    ...source(), lastSeenAt: null, lastSeenPlace: null,
  });
  assert.equal(itemValue(draft, "item_1_last_seen_place"), null);
  assert.equal(itemValue(draft, "item_1_last_seen_at"), null);
});

test("saved draft edits ignore keys that no longer exist in the Case draft", () => {
  assert.deepEqual(
    filterValidPoliceReportDraftEdits(source(), [
      { key: "last_seen_place", valueKo: "Cafe" },
      { key: "item_9_brand", valueKo: "Old item" },
      { key: "reporter_name", valueKo: "Not allowed" },
    ]),
    [{ key: "last_seen_place", valueKo: "Cafe" }],
  );
});
