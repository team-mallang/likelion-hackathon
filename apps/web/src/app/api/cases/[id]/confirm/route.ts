import { NextResponse } from "next/server";

import { prisma, Prisma } from "@project/db";
import { confirmCaseSchema } from "@project/shared";

import { hashPassword } from "@/lib/auth";
import { createCaseNumberCandidate } from "@/lib/case-number";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const MAXIMUM_CASE_NUMBER_ATTEMPTS = 10;

function isCaseNumberConflict(error: unknown) {
  if (
    !(error instanceof Prisma.PrismaClientKnownRequestError) ||
    error.code !== "P2002"
  ) {
    return false;
  }

  const target = error.meta?.target;

  return Array.isArray(target)
    ? target.includes("caseNumber")
    : String(target).includes("caseNumber");
}

async function getConfirmationConflictResponse(id: string) {
  const existingCase = await prisma.case.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingCase) {
    return NextResponse.json(
      { success: false, error: "CASE_NOT_FOUND" },
      { status: 404 },
    );
  }

  return NextResponse.json(
    { success: false, error: "CASE_ALREADY_CONFIRMED" },
    { status: 409 },
  );
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsed = confirmCaseSchema.safeParse(body);

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

    const currentCase = await prisma.case.findUnique({
      where: { id },
      select: {
        id: true,
        caseNumber: true,
        passwordHash: true,
      },
    });

    if (!currentCase) {
      return NextResponse.json(
        { success: false, error: "CASE_NOT_FOUND" },
        { status: 404 },
      );
    }

    if (currentCase.caseNumber || currentCase.passwordHash) {
      return NextResponse.json(
        { success: false, error: "CASE_ALREADY_CONFIRMED" },
        { status: 409 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.password);

    for (
      let attempt = 0;
      attempt < MAXIMUM_CASE_NUMBER_ATTEMPTS;
      attempt += 1
    ) {
      const caseNumber = createCaseNumberCandidate();

      try {
        const updateResult = await prisma.case.updateMany({
          where: {
            id,
            caseNumber: null,
            passwordHash: null,
          },
          data: {
            caseNumber,
            passwordHash,
            status: "CONFIRMED",
          },
        });

        if (updateResult.count === 0) {
          return getConfirmationConflictResponse(id);
        }

        const confirmedCase = await prisma.case.findUnique({
          where: { id },
          select: {
            id: true,
            caseNumber: true,
            type: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        if (!confirmedCase) {
          throw new Error("Confirmed case could not be loaded.");
        }

        return NextResponse.json({
          success: true,
          data: confirmedCase,
        });
      } catch (error) {
        if (isCaseNumberConflict(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Case number generation attempts exhausted.");
  } catch (error) {
    console.error("POST /api/cases/[id]/confirm error:", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
