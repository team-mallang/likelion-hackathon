import { NextResponse } from "next/server";

import { prisma } from "@project/db";
import { updateGuideStepSchema } from "@project/shared";

import { authorizeCaseRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
    guideId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, guideId } = await context.params;
    const access = await authorizeCaseRequest(request, id);

    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsed = updateGuideStepSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const guide = await prisma.guideStep.findFirst({
      where: { id: guideId, caseId: id },
    });

    if (!guide) {
      return NextResponse.json(
        { success: false, error: "GUIDE_NOT_FOUND" },
        { status: 404 },
      );
    }

    const status = parsed.data.status;
    const updatedGuide = await prisma.guideStep.update({
      where: { id: guide.id },
      data: {
        status,
        completedAt:
          status === "COMPLETED" ? guide.completedAt ?? new Date() : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { guide: updatedGuide },
    });
  } catch (error) {
    console.error("PATCH /api/cases/[id]/guides/[guideId] error:", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
