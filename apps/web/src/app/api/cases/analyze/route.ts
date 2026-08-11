import { NextResponse } from "next/server";

import {
  analyzeCaseWithMock,
  analyzeCaseWithOpenAIFallback,
  getOpenAIModel,
  isAIMockMode,
  isOpenAIConfigured,
} from "@project/ai";
import {
  analyzeCaseInputSchema,
  caseAnalysisResultSchema,
  caseAnalysisSuccessResponseSchema,
} from "@project/shared";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsedInput = analyzeCaseInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          details: parsedInput.error.flatten(),
        },
        { status: 400 },
      );
    }

    const provider = isAIMockMode() ? "mock" : "openai";

    if (provider === "openai" && !isOpenAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "AI_PROVIDER_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const execution =
      provider === "mock"
        ? {
            result: analyzeCaseWithMock(parsedInput.data),
            provider: "mock" as const,
            fallbackReason: null,
          }
        : await analyzeCaseWithOpenAIFallback(parsedInput.data);
    const analysisResult = execution.result;
    const parsedAnalysis = caseAnalysisResultSchema.safeParse(
      analysisResult,
    );

    if (!parsedAnalysis.success) {
      return NextResponse.json(
        { success: false, error: "AI_INVALID_RESPONSE" },
        { status: 502 },
      );
    }

    const responseBody = caseAnalysisSuccessResponseSchema.parse({
      success: true,
      data: parsedAnalysis.data,
      meta: {
        provider: execution.provider,
        model: execution.provider === "openai" ? getOpenAIModel() : null,
        ...(execution.fallbackReason
          ? {
              fallback: {
                from: "openai",
                reason: execution.fallbackReason,
              },
            }
          : {}),
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("POST /api/cases/analyze failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
