import type { CaseAnalysisResult } from "@project/shared";

import {
  analyzeCaseWithMock,
  type CaseAnalysisInput,
} from "./case-analysis";
import {
  AIInvalidResponseError,
  analyzeCaseWithOpenAI,
} from "./openai-case-analysis";

export type AIFallbackReason = "INVALID_RESPONSE" | "PROVIDER_ERROR";

export type CaseAnalysisExecution = {
  result: CaseAnalysisResult;
  provider: "openai" | "mock";
  fallbackReason: AIFallbackReason | null;
};

type OpenAIAnalyzer = (
  input: CaseAnalysisInput,
) => Promise<CaseAnalysisResult>;

export async function analyzeCaseWithOpenAIFallback(
  input: CaseAnalysisInput,
  openAIAnalyzer: OpenAIAnalyzer = analyzeCaseWithOpenAI,
): Promise<CaseAnalysisExecution> {
  try {
    return {
      result: await openAIAnalyzer(input),
      provider: "openai",
      fallbackReason: null,
    };
  } catch (error) {
    return {
      result: analyzeCaseWithMock(input),
      provider: "mock",
      fallbackReason:
        error instanceof AIInvalidResponseError
          ? "INVALID_RESPONSE"
          : "PROVIDER_ERROR",
    };
  }
}
