import { NextResponse } from "next/server";

import { prisma } from "@project/db";
import {
  confirmDocumentSchema,
  documentSuccessResponseSchema,
} from "@project/shared";

import { authorizeCaseRequest } from "@/lib/auth";

type RouteContext = {
  params: Promise<{
    id: string;
    documentId: string;
  }>;
};

function documentNotFoundResponse() {
  return NextResponse.json(
    { success: false, error: "DOCUMENT_NOT_FOUND" },
    { status: 404 },
  );
}

function documentSuccessResponse(document: unknown) {
  return documentSuccessResponseSchema.parse(
    JSON.parse(
      JSON.stringify({
        success: true,
        data: {
          document,
        },
      }),
    ),
  );
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id, documentId } = await context.params;
    const access = await authorizeCaseRequest(request, id);

    if (!access.ok) {
      return NextResponse.json(
        { success: false, error: access.error },
        { status: access.status },
      );
    }

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        caseId: id,
      },
    });

    if (!document) {
      return documentNotFoundResponse();
    }

    return NextResponse.json(documentSuccessResponse(document));
  } catch (error) {
    console.error(
      "GET /api/cases/[id]/documents/[documentId] error:",
      error,
    );

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const { id, documentId } = await context.params;
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

    const parsed = confirmDocumentSchema.safeParse(body);

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

    const confirmedAt = new Date();
    const updateResult = await prisma.document.updateMany({
      where: {
        id: documentId,
        caseId: id,
        status: {
          in: ["ANALYZED", "NEEDS_REVIEW"],
        },
      },
      data: {
        status: "CONFIRMED",
        confirmedAt,
      },
    });

    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        caseId: id,
      },
    });

    if (!document) {
      return documentNotFoundResponse();
    }

    if (updateResult.count === 0 && document.status !== "CONFIRMED") {
      throw new Error("Document confirmation state transition failed.");
    }

    return NextResponse.json(documentSuccessResponse(document));
  } catch (error) {
    console.error(
      "PATCH /api/cases/[id]/documents/[documentId] error:",
      error,
    );

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
