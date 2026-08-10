import assert from "node:assert/strict";
import { test } from "node:test";

import type { CaseAnalysisResult } from "@project/shared";

import type { CaseAnalysisInput } from "./case-analysis";
import { AIInvalidResponseError } from "./openai-case-analysis";
import { analyzeCaseWithOpenAIFallback } from "./resilient-case-analysis";

const input: CaseAnalysisInput = {
  initialStatement: "가방이 없어졌어요.",
  countryCode: "KR",
  type: "UNKNOWN",
  items: [],
  answers: [],
};

const openAIResult: CaseAnalysisResult = {
  summary: "가방 분실 또는 도난 가능성이 있는 사건",
  missingFields: ["type"],
  questions: [
    {
      field: "type",
      question: "누군가 가방을 가져간 정황이 있나요?",
      answerType: "boolean",
      options: [],
      required: true,
      order: 0,
    },
  ],
  items: [],
};

test("returns the OpenAI result when the provider succeeds", async () => {
  const execution = await analyzeCaseWithOpenAIFallback(
    input,
    async () => openAIResult,
  );

  assert.deepEqual(execution, {
    result: openAIResult,
    provider: "openai",
    fallbackReason: null,
  });
});

test("falls back to Mock analysis for an invalid OpenAI response", async () => {
  const execution = await analyzeCaseWithOpenAIFallback(input, async () => {
    throw new AIInvalidResponseError();
  });

  assert.equal(execution.provider, "mock");
  assert.equal(execution.fallbackReason, "INVALID_RESPONSE");
  assert.equal(execution.result.missingFields.includes("type"), false);
  assert.equal(execution.result.missingFields.includes("items"), true);
});

test("falls back to Mock analysis when the provider call fails", async () => {
  const execution = await analyzeCaseWithOpenAIFallback(input, async () => {
    throw new Error("provider unavailable");
  });

  assert.equal(execution.provider, "mock");
  assert.equal(execution.fallbackReason, "PROVIDER_ERROR");
  assert.equal(execution.result.missingFields.includes("items"), true);
});
