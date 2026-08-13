import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeTextForAI as sanitizeProductionText } from "@project/ai";

import { PII_FIXTURES } from "./dataset.ts";
import { evaluateSanitizer } from "./evaluate.ts";
import { HOLDOUT_FIXTURES } from "./holdout-dataset.ts";
import { createSanitizers } from "./sanitizers.ts";

test("PII PoC dataset has at least 40 fixtures across all required groups", () => {
  assert.ok(PII_FIXTURES.length >= 40);
  assert.deepEqual(new Set(PII_FIXTURES.map((fixture) => fixture.group)), new Set(["PII", "NON_PII", "MIXED", "STT"]));
});

test("Korean contextual layer preserves every non-PII fixture", async () => {
  const sanitizer = createSanitizers().find((candidate) => candidate.name.includes("contextual"));
  assert.ok(sanitizer);
  const summary = await evaluateSanitizer(sanitizer);
  assert.equal(summary.nonPiiPreserved, summary.nonPiiTotal);
  assert.equal(summary.falsePositiveFixtures, 0);
});

test("Korean contextual layer detects the explicitly expected entities", async () => {
  const sanitizer = createSanitizers().find((candidate) => candidate.name.includes("contextual"));
  assert.ok(sanitizer);
  const summary = await evaluateSanitizer(sanitizer);
  assert.equal(summary.detectedEntities, summary.expectedEntities);
  assert.equal(summary.falseNegatives, 0);
});

test("Korean contextual layer passes the hold-out fixtures without overlap duplicates", async () => {
  const sanitizer = createSanitizers().find((candidate) => candidate.name.includes("contextual"));
  assert.ok(sanitizer);
  const summary = await evaluateSanitizer(sanitizer, HOLDOUT_FIXTURES);
  assert.equal(summary.detectedEntities, summary.expectedEntities);
  assert.equal(summary.falseNegatives, 0);
  assert.equal(summary.falsePositiveFixtures, 0);
  for (const result of summary.results) {
    const sanitized = await sanitizer.sanitize(result.fixture.input);
    assert.equal(new Set(sanitized.detections.map((item) => `${item.start}:${item.end}`)).size, sanitized.detections.length);
  }
});

test("public API uses type-preserving placeholders and never exposes raw PII metadata", async () => {
  const raw = "제 이름은 박지민이고 전화번호는 010-1234-5678입니다.";
  const result = await sanitizeProductionText(raw);
  assert.equal(result.text, "제 이름은 [NAME]이고 전화번호는 [PHONE_NUMBER]입니다.");
  assert.deepEqual(result.detections, [{ type: "NAME" }, { type: "PHONE_NUMBER" }]);
  assert.equal(JSON.stringify(result).includes("박지민"), false);
  assert.equal(JSON.stringify(result).includes("010-1234-5678"), false);
  assert.equal("value" in result.detections[0]!, false);
  assert.equal("start" in result.detections[0]!, false);
});

test("overlapping numeric shapes are classified by context without duplicates", async () => {
  const sanitizer = createSanitizers().find((candidate) => candidate.name.includes("contextual"));
  assert.ok(sanitizer);
  const cases = [
    ["전화번호는 010-1234-5678입니다.", "전화번호는 [PHONE_NUMBER]입니다."],
    ["계좌번호는 010-1234-5678입니다.", "계좌번호는 [BANK_ACCOUNT]입니다."],
    ["사건번호는 010-1234-5678입니다.", "사건번호는 010-1234-5678입니다."],
    ["호텔 예약번호는 M12345678입니다.", "호텔 예약번호는 M12345678입니다."],
    ["여권번호는 M12345678입니다.", "여권번호는 [PASSPORT]입니다."],
    ["락커 번호는 030101-3234567입니다.", "락커 번호는 030101-3234567입니다."],
    ["주민번호는 030101-3234567입니다.", "주민번호는 [RRN]입니다."],
    ["호텔 예약 코드는 4111-1111-1111-1111입니다.", "호텔 예약 코드는 4111-1111-1111-1111입니다."],
    ["카드번호는 4111-1111-1111-1111입니다.", "카드번호는 [CARD_NUMBER]입니다."],
  ] as const;
  for (const [input, expected] of cases) {
    const result = await sanitizer.sanitize(input);
    assert.equal(result.masked, expected);
    assert.equal(new Set(result.detections.map((item) => `${item.start}:${item.end}`)).size, result.detections.length);
  }
});

test("production packages/ai sanitizer passes development and hold-out fixtures", async () => {
  for (const fixture of [...PII_FIXTURES, ...HOLDOUT_FIXTURES]) {
    const expected = fixture.entities
      .map((entity) => ({ ...entity, start: fixture.input.indexOf(entity.value) }))
      .sort((left, right) => right.start - left.start)
      .reduce((text, entity) => `${text.slice(0, entity.start)}[${entity.category}]${text.slice(entity.start + entity.value.length)}`, fixture.input);
    const result = await sanitizeProductionText(fixture.input);
    assert.equal(result.text, expected, fixture.id);
    const serialized = JSON.stringify(result);
    for (const entity of fixture.entities) assert.equal(serialized.includes(entity.value), false, fixture.id);
    assert.deepEqual(result.detections.map((item) => item.type), fixture.entities.map((item) => item.category), fixture.id);
  }
});
