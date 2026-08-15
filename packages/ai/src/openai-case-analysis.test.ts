import assert from "node:assert/strict";
import { test } from "node:test";

import type { CaseAnalysisResult } from "@project/shared";

import type { CaseAnalysisInput } from "./case-analysis";
import { normalizeFollowUpQuestions } from "./openai-case-analysis";

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
