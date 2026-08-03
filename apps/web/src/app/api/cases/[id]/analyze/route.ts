import { NextResponse } from "next/server";

import { analyzeCaseWithMock, isAIMockMode } from "@project/ai";
import { prisma, Prisma } from "@project/db";
import { caseAnalysisResultSchema } from "@project/shared";

import { authorizeCaseRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const access = await authorizeCaseRequest(request, id);

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

    if (!isAIMockMode()) {
      return NextResponse.json(
        { success: false, error: "AI_PROVIDER_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const analysisResult = analyzeCaseWithMock(foundCase);
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
        provider: "mock",
      },
    });
  } catch (error) {
    console.error("POST /api/cases/[id]/analyze error:", error);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { success: false, error: "CASE_NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
