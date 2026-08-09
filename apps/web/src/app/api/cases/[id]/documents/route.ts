import { NextResponse } from "next/server";

import { Prisma, prisma } from "@project/db";
import {
  createDocumentSchema,
  documentListSuccessResponseSchema,
  documentSuccessResponseSchema,
} from "@project/shared";

import { authorizeCaseRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function toJsonValue(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

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

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "INVALID_JSON" },
        { status: 400 },
      );
    }

    const parsed = createDocumentSchema.safeParse(body);

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

    const input = parsed.data;
    const document = await prisma.document.create({
      data: {
        caseId: id,
        type: input.type,
        status: input.status,
        analysisSummary: input.analysisSummary,
        extractedData:
          input.extractedData === null
            ? Prisma.DbNull
            : input.extractedData,
        missingFields: input.missingFields,
        analyzedAt: input.analyzedAt
          ? new Date(input.analyzedAt)
          : new Date(),
        confirmedAt: null,
      },
    });

    const responseBody = documentSuccessResponseSchema.parse(
      toJsonValue({
        success: true,
        data: {
          document,
        },
      }),
    );

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error("POST /api/cases/[id]/documents error:", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export async function GET(
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

    const documents = await prisma.document.findMany({
      where: {
        caseId: id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const responseBody = documentListSuccessResponseSchema.parse(
      toJsonValue({
        success: true,
        data: {
          documents,
        },
      }),
    );

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("GET /api/cases/[id]/documents error:", error);

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
