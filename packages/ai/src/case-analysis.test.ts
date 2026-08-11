import assert from "node:assert/strict";
import { test } from "node:test";

import { analyzeCaseWithMock } from "./case-analysis";

test("UNKNOWN cases use the same follow-up criteria as LOST", () => {
  const result = analyzeCaseWithMock({
    initialStatement: "가방이 없어졌어요.",
    countryCode: "KR",
    type: "UNKNOWN",
    items: [],
    answers: [],
  });

  assert.equal(result.missingFields.includes("type"), false);
  assert.equal(result.missingFields.includes("items[0].name"), true);
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
    estimatedOccurredAt: "2026-08-10T10:15:00.000Z",
    estimatedOccurredPlace: "Subway",
    routeAfterLastSeen: "Seoul Station to City Hall Station",
    storageState: "Inside a shoulder bag",
    description: "No additional clue",
    items: [
      {
        name: "지갑",
        category: "WALLET_BAG",
        quantity: 1,
        color: "갈색",
        brand: "무브랜드",
        shape: "반지갑",
        contentsDescription: "카드와 영수증",
      },
      {
        name: "휴대폰",
        category: "PHONE",
        quantity: 1,
        identifyingFeature: "투명 케이스",
        brand: "Samsung",
        model: "Galaxy",
        phoneCaseDescription: "투명 케이스",
        findMyDeviceAvailable: true,
      },
    ],
    answers: [],
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
    estimatedOccurredAt: "2026-08-10T10:15:00.000Z",
    estimatedOccurredPlace: "Subway",
    routeAfterLastSeen: "Seoul Station to City Hall Station",
    storageState: "Inside a backpack",
    description: "No additional clue",
    items: [
      {
        name: "가방",
        category: "WALLET_BAG",
        quantity: 1,
        color: "검정",
        brand: "Travel Pack",
        identifyingFeature: "주황색 열쇠고리",
        shape: "백팩",
        contentsDescription: "옷과 충전기",
      },
    ],
    answers: [],
  });

  assert.deepEqual(result.missingFields, []);
  assert.deepEqual(result.questions, []);
});

test("item-specific questions are generated only for the matching category", () => {
  const result = analyzeCaseWithMock({
    initialStatement: "카드를 잃어버렸어요.",
    countryCode: "KR",
    type: "LOST",
    lastSeenAt: "2026-08-10T10:00:00.000Z",
    lastSeenPlace: "Seoul Station",
    discoveredAt: "2026-08-10T10:30:00.000Z",
    discoveredPlace: "City Hall Station",
    estimatedOccurredAt: "2026-08-10T10:15:00.000Z",
    estimatedOccurredPlace: "Subway",
    routeAfterLastSeen: "Seoul Station to City Hall Station",
    storageState: "Inside a wallet",
    description: "No additional clue",
    items: [
      {
        name: "신용카드",
        category: "CARD",
        quantity: 1,
        identifyingFeature: "파란색 카드",
      },
    ],
    answers: [],
  });
  const fields = result.questions.map((question) => question.field);

  assert.equal(fields.includes("items[0].brand"), true);
  assert.equal(fields.includes("items[0].unauthorizedTransactionOccurred"), true);
  assert.equal(fields.includes("items[0].phoneCaseDescription"), false);
  assert.equal(fields.includes("items[0].passportNumberKnown"), false);
  assert.equal(fields.includes("items[0].cashAmount"), false);
});
