import { NextResponse } from "next/server";

import {
  AIInvalidResponseError,
  analyzeCaseWithMock,
  analyzeCaseWithOpenAI,
  getOpenAIModel,
  isAIMockMode,
  isOpenAIConfigured,
} from "@project/ai";
import { prisma } from "@project/db";
import { caseAnalysisResultSchema } from "@project/shared";

import { authorizeCaseMutationRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function isPrismaP2025Error(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2025"
  );
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const access = await authorizeCaseMutationRequest(request, id);

    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status },
      );
    }

    const foundCase = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        initialStatement: true,
        lastSeenAt: true,
        lastSeenPlace: true,
        discoveredAt: true,
        discoveredPlace: true,
        description: true,
        items: {
          select: {
            name: true,
            category: true,
            color: true,
            brand: true,
            model: true,
            identifyingFeature: true,
          },
        },
      },
    });

    if (!foundCase) {
      return NextResponse.json(
        { success: false, error: "CASE_NOT_FOUND" },
        { status: 404 },
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
        ? analyzeCaseWithMock(foundCase)
        : await analyzeCaseWithOpenAI(foundCase);
    const parsedAnalysis = caseAnalysisResultSchema.safeParse(
      analysisResult,
    );

    if (!parsedAnalysis.success) {
      return NextResponse.json(
        { success: false, error: "AI_INVALID_RESPONSE" },
        { status: 502 },
      );
    }

    const validatedAnalysis = parsedAnalysis.data;
    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        aiSummary: validatedAnalysis.summary,
        missingFields: validatedAnalysis.missingFields,
      },
      select: {
        id: true,
        aiSummary: true,
        missingFields: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...validatedAnalysis,
        savedCase: updatedCase,
      },
      meta: {
        provider,
        model: provider === "openai" ? getOpenAIModel() : null,
      },
    });
  } catch (error) {
    if (error instanceof AIInvalidResponseError) {
      return NextResponse.json(
        { success: false, error: "AI_INVALID_RESPONSE" },
        { status: 502 },
      );
    }

    if (isPrismaP2025Error(error)) {
      return NextResponse.json(
        { success: false, error: "CASE_NOT_FOUND" },
        { status: 404 },
      );
    }

    console.error("POST /api/cases/[id]/analyze failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
