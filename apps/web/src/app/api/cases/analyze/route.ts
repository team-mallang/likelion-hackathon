import { NextResponse } from "next/server";

import {
  AIAnalysisError,
  AIInvalidResponseError,
  analyzeCaseWithMock,
  analyzeCaseWithOpenAI,
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

    const analysisResult =
      provider === "mock"
        ? analyzeCaseWithMock(parsedInput.data)
        : await analyzeCaseWithOpenAI(parsedInput.data);
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
        provider,
        model: provider === "openai" ? getOpenAIModel() : null,
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    if (error instanceof AIInvalidResponseError) {
      return NextResponse.json(
        { success: false, error: "AI_INVALID_RESPONSE" },
        { status: 502 },
      );
    }

    if (error instanceof AIAnalysisError) {
      return NextResponse.json(
        { success: false, error: "AI_ANALYSIS_FAILED" },
        { status: 502 },
      );
    }

    console.error("POST /api/cases/analyze failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
