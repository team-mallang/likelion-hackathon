import assert from "node:assert/strict";
import { test } from "node:test";

import { initialCaseDraft } from "@/features/case/types/caseDraft";

import {
  applyCaseAnswer,
  buildConfirmedCaseInput,
} from "./applyCaseAnswer";

const caseFieldScenarios = [
  ["lastSeenPlace", "서울역"],
  ["lastSeenAt", "2026-08-10T03:00:00.000Z"],
  ["discoveredPlace", "시청역"],
  ["discoveredAt", "2026-08-10T03:30:00.000Z"],
  ["estimatedOccurredPlace", "1호선 열차 안"],
  ["estimatedOccurredAt", "2026-08-10T03:15:00.000Z"],
  ["routeAfterLastSeen", "서울역에서 시청역으로 이동"],
  ["storageState", "백팩 앞주머니에 보관"],
  ["description", "2번 출구 근처에서 마지막으로 확인함"],
];

for (const [field, value] of caseFieldScenarios) {
  test(`${field} answer updates the canonical Case draft field`, () => {
    const result = applyCaseAnswer(initialCaseDraft, { field, value });

    assert.equal(result[field], value);
    assert.deepEqual(result.answers, [{ field, value }]);
  });
}

test("reanswering the same field replaces both answer and canonical value", () => {
  const firstResult = applyCaseAnswer(initialCaseDraft, {
    field: "lastSeenPlace",
    value: "서울역",
  });
  const secondResult = applyCaseAnswer(firstResult, {
    field: "lastSeenPlace",
    value: "용산역",
  });

  assert.equal(secondResult.lastSeenPlace, "용산역");
  assert.deepEqual(secondResult.answers, [
    { field: "lastSeenPlace", value: "용산역" },
  ]);
});

test("an indexed item answer updates only the identified item", () => {
  const draft = {
    ...initialCaseDraft,
    items: [
      { name: "지갑", quantity: 1 },
      { name: "휴대폰", quantity: 1 },
    ],
  };
  const result = applyCaseAnswer(draft, {
    field: "items[1].color",
    value: "검정색",
  });

  assert.equal(result.items[0]?.color, undefined);
  assert.equal(result.items[1]?.color, "검정색");
});

test("the first representative item answer creates items[0]", () => {
  const result = applyCaseAnswer(initialCaseDraft, {
    field: "items[0].name",
    value: "휴대폰",
  });

  assert.deepEqual(result.items, [{ name: "휴대폰", quantity: 1 }]);
});

test("category-specific item answers update canonical item fields", () => {
  const draft = {
    ...initialCaseDraft,
    items: [{ name: "휴대폰", category: "PHONE", quantity: 1 }],
  };
  const withCase = applyCaseAnswer(draft, {
    field: "items[0].phoneCaseDescription",
    value: "투명 케이스",
  });
  const result = applyCaseAnswer(withCase, {
    field: "items[0].findMyDeviceAvailable",
    value: true,
  });

  assert.equal(result.items[0]?.phoneCaseDescription, "투명 케이스");
  assert.equal(result.items[0]?.findMyDeviceAvailable, true);
});

test("an item answer without an index is retained without guessing an item", () => {
  const draft = {
    ...initialCaseDraft,
    items: [{ name: "지갑", quantity: 1 }],
  };
  const result = applyCaseAnswer(draft, {
    field: "items.color",
    value: "검정색",
  });

  assert.equal(result.items[0]?.color, undefined);
  assert.deepEqual(result.answers, [
    { field: "items.color", value: "검정색" },
  ]);
});

test("the S06 request uses the latest canonical Case values", () => {
  const withFirstAnswer = applyCaseAnswer(initialCaseDraft, {
    field: "lastSeenPlace",
    value: "서울역",
  });
  const withLatestAnswer = applyCaseAnswer(withFirstAnswer, {
    field: "lastSeenPlace",
    value: "용산역",
  });
  const request = buildConfirmedCaseInput(
    {
      ...withLatestAnswer,
      items: [{ name: "지갑", quantity: 1 }],
    },
    "password123",
  );

  assert.equal(request.lastSeenPlace, "용산역");
  assert.equal(request.password, "password123");
  assert.equal("answers" in request, false);
});
