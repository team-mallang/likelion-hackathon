import assert from "node:assert/strict";
import { test } from "node:test";

import { normalizeDateTimeAnswer } from "./caseAnswerInput";

test("normalizes a Korean date and afternoon time to ISO 8601", () => {
  assert.equal(
    normalizeDateTimeAnswer("2026 08 16 오후 2시"),
    "2026-08-16T05:00:00.000Z",
  );
});

test("keeps an existing ISO 8601 datetime", () => {
  assert.equal(
    normalizeDateTimeAnswer("2026-08-16T14:00:00+09:00"),
    "2026-08-16T05:00:00.000Z",
  );
});

test("rejects an invalid date", () => {
  assert.equal(normalizeDateTimeAnswer("2026 02 30 오후 2시"), null);
});
