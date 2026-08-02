import { NextResponse } from "next/server";

import { prisma } from "@project/db";
import { authenticateCaseSchema } from "@project/shared";

import {
  createCaseAccessToken,
  verifyPassword,
} from "@/lib/auth";

export async function POST(request: Request) {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_JSON",
        },
        {
          status: 400,
        },
      );
    }

    const parsed = authenticateCaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          details: parsed.error.flatten(),
        },
        {
          status: 400,
        },
      );
    }

    const { caseNumber, password } = parsed.data;

    const foundCase = await prisma.case.findUnique({
      where: {
        caseNumber,
      },
      select: {
        id: true,
        caseNumber: true,
        passwordHash: true,
        status: true,
      },
    });

    if (!foundCase || !foundCase.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CREDENTIALS",
        },
        {
          status: 401,
        },
      );
    }

    const passwordMatches = await verifyPassword(
      password,
      foundCase.passwordHash,
    );

    if (!passwordMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_CREDENTIALS",
        },
        {
          status: 401,
        },
      );
    }

    const accessToken = await createCaseAccessToken(foundCase.id);

    return NextResponse.json({
      success: true,
      data: {
        caseId: foundCase.id,
        caseNumber: foundCase.caseNumber,
        status: foundCase.status,
        accessToken,
      },
    });
  } catch (error) {
    console.error("POST /api/cases/auth error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      {
        status: 500,
      },
    );
  }
}
