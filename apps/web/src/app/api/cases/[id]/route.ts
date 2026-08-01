import { NextResponse } from "next/server";

import { prisma, Prisma } from "@project/db";
import { updateCaseSchema } from "@project/shared";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function removeSensitiveFields<T extends { passwordHash?: string | null }>(
  data: T,
) {
  const { passwordHash: _passwordHash, ...safeData } = data;
  return safeData;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const foundCase = await prisma.case.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
        guideSteps: {
          orderBy: {
            stepOrder: "asc",
          },
        },
      },
    });

    if (!foundCase) {
      return NextResponse.json(
        {
          success: false,
          error: "CASE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: removeSensitiveFields(foundCase),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    const body: unknown = await request.json();

    const parsed = updateCaseSchema.safeParse(body);

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

    const existingCase = await prisma.case.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingCase) {
      return NextResponse.json(
        {
          success: false,
          error: "CASE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    const input = parsed.data;

    const updatedCase = await prisma.case.update({
      where: { id },
      data: {
        type: input.type,

        lastSeenAt:
          input.lastSeenAt === undefined
            ? undefined
            : input.lastSeenAt === null
              ? null
              : new Date(input.lastSeenAt),

        lastSeenPlace: input.lastSeenPlace,

        discoveredAt:
          input.discoveredAt === undefined
            ? undefined
            : input.discoveredAt === null
              ? null
              : new Date(input.discoveredAt),

        discoveredPlace: input.discoveredPlace,

        description: input.description,
        aiSummary: input.aiSummary,
        missingFields:
          input.missingFields === null ? Prisma.DbNull : input.missingFields,
      },
      include: {
        items: true,
        guideSteps: {
          orderBy: {
            stepOrder: "asc",
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: removeSensitiveFields(updatedCase),
    });
  } catch (error) {
    console.error("PATCH /api/cases/[id] error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
