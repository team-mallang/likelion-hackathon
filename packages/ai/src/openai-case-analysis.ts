// OpenAI를 이용해 사건 정보를 구조화된 형태로 분석하는 함수

import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";

import {
  caseAnalysisResultSchema,
  type CaseAnalysisResult,
} from "@project/shared";

import { getOpenAIClient, getOpenAIModel } from "./client";

import type { CaseAnalysisInput } from "./case-analysis";

export class AIInvalidResponseError extends Error {
  constructor() {
    super("OpenAI returned an invalid case analysis response.");
    this.name = "AIInvalidResponseError";
  }
}

// 사건 데이터를 OpenAI에 전달하기 쉬운 JSON 문자열로 변환
function createCaseAnalysisInputText(input: CaseAnalysisInput) {
  return JSON.stringify(
    {
      initialStatement: input.initialStatement,
      lastSeenAt: input.lastSeenAt ?? null,
      lastSeenPlace: input.lastSeenPlace ?? null,
      discoveredAt: input.discoveredAt ?? null,
      discoveredPlace: input.discoveredPlace ?? null,
      description: input.description ?? null,
      items: input.items,
    },
    null,
    2,
  )
}

// OpenAI를 이용해 사건 요약, 누락 필드, 추가 질문을 생성
export async function analyzeCaseWithOpenAI(
  input: CaseAnalysisInput,
): Promise<CaseAnalysisResult> {
  const openai = getOpenAIClient();

  let response;

  try {
    response = await openai.responses.parse({
      model: getOpenAIModel(),

      input: [
        {
          role: "system",
          content: [
          '너는 해외 여행 중 발생한 분실·도난 사건을 정리하는 AI다.',
          '사용자가 제공한 사건 정보를 분석해 사건 요약, 누락 필드, 추가 질문을 생성한다.',
          '확실하지 않은 정보는 추측하지 않는다.',
          '누락된 정보만 질문으로 만든다.',
          '질문은 사용자가 이해하기 쉬운 한국어로 작성한다.',
          ].join("\n"),
        },
        {
          role: "user",
          content: createCaseAnalysisInputText(input),
        },
      ],

      text: {
        format: zodTextFormat(caseAnalysisResultSchema, "case_analysis"),
      },
    });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      throw new AIInvalidResponseError();
    }

    throw error;
  }

  const parsedResult = caseAnalysisResultSchema.safeParse(
    response.output_parsed,
  );

  if (!parsedResult.success) {
    throw new AIInvalidResponseError();
  }

  return parsedResult.data;
}
