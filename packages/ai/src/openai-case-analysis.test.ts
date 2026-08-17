import assert from "node:assert/strict";
import { test } from "node:test";

import {
  caseAnalysisResultSchema,
  type CaseAnalysisResult,
} from "@project/shared";

import type { CaseAnalysisInput } from "./case-analysis";
import {
  normalizeFollowUpQuestions,
  supplementExplicitCaseDetails,
  supplementMissingDetailQuestions,
} from "./openai-case-analysis";

const input: CaseAnalysisInput = {
  initialStatement: "서울역에서 검은 휴대폰을 잃어버렸어요.",
  countryCode: "KR",
  type: "LOST",
  lastSeenPlace: "서울역",
  items: [],
  answers: [],
};

const result: CaseAnalysisResult = {
  summary: "서울역에서 검은 휴대폰을 분실한 사건입니다.",
  details: {
    type: "LOST",
    lastSeenAt: null,
    lastSeenPlace: "서울역",
    discoveredAt: null,
    discoveredPlace: null,
    estimatedOccurredAt: null,
    estimatedOccurredPlace: null,
    routeAfterLastSeen: null,
    storageState: null,
    description: null,
  },
  items: [],
  missingFields: ["lastSeenAt", "lastSeenPlace"],
  questions: [
    {
      field: "lastSeenAt",
      question: "서울역에서 휴대폰을 마지막으로 확인한 시각은 언제인가요?",
      answerType: "datetime",
      options: [],
      required: true,
      order: 4,
    },
    {
      field: "lastSeenPlace",
      question: "마지막으로 본 장소는 어디인가요?",
      answerType: "text",
      options: [],
      required: true,
      order: 5,
    },
    {
      field: "lastSeenAt",
      question: "중복 질문",
      answerType: "datetime",
      options: [],
      required: true,
      order: 6,
    },
  ],
};

test("preserves contextual AI questions while removing resolved and duplicate fields", () => {
  const normalized = normalizeFollowUpQuestions(input, result);

  assert.deepEqual(normalized.missingFields, ["lastSeenAt"]);
  assert.equal(
    normalized.questions[0]?.question,
    "서울역에서 휴대폰을 마지막으로 확인한 시각은 언제인가요?",
  );
  assert.equal(normalized.questions[0]?.order, 0);
});

test("removes questions already answered by the user", () => {
  const normalized = normalizeFollowUpQuestions(
    {
      ...input,
      answers: [{ field: "lastSeenAt", value: "2026-08-15T10:00:00+09:00" }],
    },
    result,
  );

  assert.deepEqual(normalized.questions, []);
  assert.deepEqual(normalized.missingFields, []);
});

test("supplements explicit Tokyo theft facts before follow-up normalization", () => {
  const theftInput: CaseAnalysisInput = {
    initialStatement: [
      "\uC624\uB298 \uC624\uD6C4 7\uC2DC\uCBE4 \uC77C\uBCF8 \uB3C4\uCFC4 \uC2E0\uC8FC\uCFE0\uC5ED \uADFC\uCC98 \uCE74\uD398\uC5D0\uC11C \uAC00\uBC29\uC744 \uB3C4\uB09C\uB2F9\uD55C \uAC83 \uAC19\uC2B5\uB2C8\uB2E4.",
      "\uC624\uD6C4 6\uC2DC 30\uBD84\uCBE4 \uCE74\uD398 \uD14C\uC774\uBE14 \uC606 \uC758\uC790\uC5D0 \uAC80\uC740\uC0C9 \uBC31\uD329\uC744 \uB450\uC5C8\uACE0, \uC7A0\uC2DC \uC790\uB9AC\uB97C \uBE44\uC6B4 \uB4A4 \uB3CC\uC544\uC624\uB2C8 \uAC00\uBC29\uC774 \uC5C6\uC5B4\uC84C\uC2B5\uB2C8\uB2E4.",
    ].join(" "),
    countryCode: "JP",
    type: "STOLEN",
    referenceTime: "2026-08-16T05:00:00.000Z",
    timeZone: "Asia/Seoul",
    items: [],
    answers: [],
  };
  const emptyDetails: CaseAnalysisResult = {
    ...result,
    details: {
      ...result.details,
      type: "STOLEN",
      lastSeenAt: null,
      lastSeenPlace: null,
      discoveredAt: null,
      discoveredPlace: null,
      estimatedOccurredAt: null,
      estimatedOccurredPlace: null,
      routeAfterLastSeen: null,
      storageState: null,
    },
    questions: [],
  };

  const supplemented = supplementExplicitCaseDetails(theftInput, emptyDetails);
  const normalized = normalizeFollowUpQuestions(
    theftInput,
    supplementMissingDetailQuestions(theftInput, supplemented),
  );

  assert.equal(normalized.details.lastSeenAt, "2026-08-16T09:30:00.000Z");
  assert.equal(normalized.details.lastSeenPlace, "\uCE74\uD398 \uD14C\uC774\uBE14 \uC606 \uC758\uC790");
  assert.equal(normalized.details.estimatedOccurredAt, "2026-08-16T10:00:00.000Z");
  assert.equal(normalized.details.estimatedOccurredPlace, "\uC77C\uBCF8 \uB3C4\uCFC4 \uC2E0\uC8FC\uCFE0\uC5ED \uADFC\uCC98 \uCE74\uD398");
  assert.equal(normalized.details.storageState, "\uCE74\uD398 \uD14C\uC774\uBE14 \uC606 \uC758\uC790\uC5D0 \uB450\uACE0 \uC790\uB9AC\uB97C \uBE44\uC6B4 \uC0C1\uD0DC");
  assert.deepEqual(normalized.missingFields, ["discoveredAt", "discoveredPlace", "routeAfterLastSeen"]);
  assert.equal(caseAnalysisResultSchema.safeParse(normalized).success, true);
});

test("does not ask again for incident facts explicitly present in the initial statement", () => {
  const explicitInput: CaseAnalysisInput = {
    initialStatement: [
      "\uC624\uB298 \uC624\uD6C4 6\uC2DC 30\uBD84 \uB3C4\uCFC4 \uC2E0\uC8FC\uCFE0\uC758 \uCE74\uD398\uC5D0\uC11C \uAC00\uBC29\uC744 \uB3C4\uB09C\uB2F9\uD55C \uAC83 \uAC19\uC2B5\uB2C8\uB2E4.",
      "\uCE74\uD398 \uD14C\uC774\uBE14 \uC606 \uC758\uC790\uC5D0 \uAC00\uBC29\uC744 \uC62C\uB824\uB450\uACE0 \uD654\uC7A5\uC2E4\uC5D0 \uAC14\uC2B5\uB2C8\uB2E4.",
      "\uC624\uB298 \uC624\uD6C4 7\uC2DC \uC2E0\uC8FC\uCFE0\uC5ED \uADFC\uCC98\uC5D0\uC11C \uC5C6\uC5B4\uC9C4 \uAC83\uC744 \uD655\uC778\uD588\uC2B5\uB2C8\uB2E4.",
    ].join(" "),
    countryCode: "JP",
    type: "UNKNOWN",
    referenceTime: "2026-08-16T05:00:00.000Z",
    timeZone: "Asia/Tokyo",
    items: [],
    answers: [],
  };
  const emptyResult: CaseAnalysisResult = {
    ...result,
    details: {
      type: "UNKNOWN", lastSeenAt: null, lastSeenPlace: null,
      discoveredAt: null, discoveredPlace: null,
      estimatedOccurredAt: null, estimatedOccurredPlace: null,
      routeAfterLastSeen: null, storageState: null, description: null,
    },
    missingFields: [],
    questions: [
      "type", "discoveredAt", "discoveredPlace", "estimatedOccurredAt", "estimatedOccurredPlace", "storageState",
    ].map((field, order) => ({ field, question: field, answerType: "text" as const, options: [], required: false, order })),
  };

  const normalized = normalizeFollowUpQuestions(
    explicitInput,
    supplementMissingDetailQuestions(
      explicitInput,
      supplementExplicitCaseDetails(explicitInput, emptyResult),
    ),
  );

  assert.equal(normalized.details.type, "STOLEN");
  assert.equal(normalized.details.discoveredAt, "2026-08-16T10:00:00.000Z");
  assert.equal(normalized.details.discoveredPlace, "\uC2E0\uC8FC\uCFE0\uC5ED");
  for (const field of ["type", "discoveredAt", "discoveredPlace", "estimatedOccurredAt", "estimatedOccurredPlace", "storageState"]) {
    assert.equal(normalized.questions.some((question) => question.field === field), false, field);
  }
});

test("does not ask again for known item fields from existing items or prior answers", () => {
  const itemInput: CaseAnalysisInput = {
    initialStatement: "A black iPhone 15 was lost.",
    countryCode: "JP",
    type: "LOST",
    items: [{
      name: "iPhone 15",
      category: "PHONE",
      quantity: 1,
      brand: "Apple",
      color: "black",
      model: "iPhone 15",
      identifyingFeature: "transparent case",
    }],
    answers: [
      { field: "items[0].phoneCaseDescription", value: "transparent case" },
    ],
  };
  const itemFields = [
    "name", "quantity", "category", "brand", "color", "model", "identifyingFeature", "phoneCaseDescription", "cashAmount",
  ];
  const normalized = normalizeFollowUpQuestions(itemInput, {
    ...result,
    items: [],
    missingFields: itemFields.map((field) => `items[0].${field}`),
    questions: itemFields.map((field, order) => ({
      field: `items[0].${field}`,
      question: `known ${field}`,
      answerType: "text" as const,
      options: [],
      required: true,
      order,
    })),
  });

  assert.equal(normalized.questions.some((question) => question.field.startsWith("items[0].")), false);
  assert.equal(normalized.items[0]?.brand, "Apple");
  assert.equal(normalized.items[0]?.phoneCaseDescription, "transparent case");
});
