import type { CaseAnalysisResult } from "@project/shared";

import {
  analyzeCaseWithMock,
  type CaseAnalysisInput,
} from "./case-analysis";
import {
  AIInvalidResponseError,
  analyzeCaseWithOpenAI,
  normalizeFollowUpQuestions,
  supplementExplicitCaseDetails,
  supplementMissingDetailQuestions,
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
  const startedAt = Date.now();

  try {
    const execution: CaseAnalysisExecution = {
      result: await openAIAnalyzer(input),
      provider: "openai",
      fallbackReason: null,
    };

    console.info("[CaseAnalysis] OpenAI analysis completed", {
      durationMs: Date.now() - startedAt,
    });

    return execution;
  } catch (error) {
    const providerError = error as {
      name?: unknown;
      code?: unknown;
      status?: unknown;
      cause?: {
        name?: unknown;
        code?: unknown;
        status?: unknown;
      };
    };
    const rootError = providerError.cause ?? providerError;

    console.warn("[CaseAnalysis] OpenAI analysis failed; using fallback", {
      durationMs: Date.now() - startedAt,
      errorName:
        typeof rootError?.name === "string"
          ? rootError.name
          : "UnknownError",
      errorCode:
        typeof rootError?.code === "string"
          ? rootError.code
          : undefined,
      status:
        typeof rootError?.status === "number"
          ? rootError.status
          : undefined,
    });

    const fallbackResult = normalizeFollowUpQuestions(
      input,
      supplementMissingDetailQuestions(
        input,
        supplementExplicitCaseDetails(input, analyzeCaseWithMock(input)),
      ),
    );

    return {
      result: fallbackResult,
      provider: "mock",
      fallbackReason:
        error instanceof AIInvalidResponseError
          ? "INVALID_RESPONSE"
          : "PROVIDER_ERROR",
    };
  }
}
