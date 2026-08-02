import { NextResponse } from "next/server";

import { analyzeCaseWithMock, isAIMockMode } from "@project/ai";
import { prisma } from "@project/db";
import { caseAnalysisResultSchema } from "@project/shared";

import {
  getBearerToken,
  verifyCaseAccessToken,
} from "@/lib/auth";

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
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        { success: false, error: "AUTHENTICATION_REQUIRED" },
        { status: 401 },
      );
    }

    try {
      const tokenPayload = await verifyCaseAccessToken(token);

      if (tokenPayload.caseId !== id) {
        return NextResponse.json(
          { success: false, error: "FORBIDDEN" },
          { status: 403 },
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_ACCESS_TOKEN" },
        { status: 401 },
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

    return NextResponse.json({
      success: true,
      data: parsedAnalysis.data,
      meta: {
        provider: "mock",
      },
    });
  } catch (error) {
    console.error("POST /api/cases/[id]/analyze error:", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
