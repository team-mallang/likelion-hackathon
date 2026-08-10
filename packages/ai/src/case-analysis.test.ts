import assert from "node:assert/strict";
import { test } from "node:test";

import { analyzeCaseWithMock } from "./case-analysis";

test("UNKNOWN cases keep asking questions needed to classify the incident", () => {
  const result = analyzeCaseWithMock({
    initialStatement: "가방이 없어졌어요.",
    countryCode: "KR",
    type: "UNKNOWN",
    items: [],
  });

  assert.equal(result.missingFields[0], "type");
  assert.equal(result.questions[0]?.field, "type");
  assert.match(result.questions[0]?.question ?? "", /잃어버린|가져간/);
  assert.equal(result.missingFields.includes("items"), true);
});

test("missing details are collected for every item", () => {
  const result = analyzeCaseWithMock({
    initialStatement: "지갑과 휴대폰을 잃어버렸어요.",
    countryCode: "KR",
    type: "LOST",
    lastSeenAt: "2026-08-10T10:00:00.000Z",
    lastSeenPlace: "Seoul Station",
    discoveredAt: "2026-08-10T10:30:00.000Z",
    discoveredPlace: "City Hall Station",
    items: [
      { name: "지갑", quantity: 1, color: "갈색" },
      {
        name: "휴대폰",
        quantity: 1,
        identifyingFeature: "투명 케이스",
      },
    ],
  });

  assert.deepEqual(result.missingFields, [
    "items[0].identifyingFeature",
    "items[1].color",
  ]);
  assert.deepEqual(
    result.questions.map((question) => question.field),
    result.missingFields,
  );
});

test("complete LOST case input does not create unnecessary questions", () => {
  const result = analyzeCaseWithMock({
    initialStatement: "검은 가방을 역에서 잃어버렸어요.",
    countryCode: "KR",
    type: "LOST",
    lastSeenAt: "2026-08-10T10:00:00.000Z",
    lastSeenPlace: "Seoul Station",
    discoveredAt: "2026-08-10T10:30:00.000Z",
    discoveredPlace: "City Hall Station",
    items: [
      {
        name: "가방",
        quantity: 1,
        color: "검정",
        identifyingFeature: "주황색 열쇠고리",
      },
    ],
  });

  assert.deepEqual(result.missingFields, []);
  assert.deepEqual(result.questions, []);
});
