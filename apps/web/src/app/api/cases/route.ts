import { NextResponse } from "next/server";

import { Prisma, prisma } from "@project/db";
import {
  createConfirmedCaseSchema,
  createConfirmedCaseSuccessResponseSchema,
} from "@project/shared";

import { hashPassword } from "@/lib/auth";
import { createCaseNumberCandidate } from "@/lib/case-number";

const MAXIMUM_CASE_NUMBER_ATTEMPTS = 10;

function isCaseNumberConflict(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }

  if (error.code !== "P2002") {
    return false;
  }

  const target =
    "meta" in error &&
    typeof error.meta === "object" &&
    error.meta !== null &&
    "target" in error.meta
      ? error.meta.target
      : undefined;

  if (Array.isArray(target)) {
    return target.includes("caseNumber");
  }

  return target === "caseNumber";
}

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
    const parsed = createConfirmedCaseSchema.safeParse(body);

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
    const passwordHash = await hashPassword(input.password);

    for (
      let attempt = 0;
      attempt < MAXIMUM_CASE_NUMBER_ATTEMPTS;
      attempt += 1
    ) {
      const caseNumber = createCaseNumberCandidate(input.countryCode);

      try {
        const responseBody = await prisma.$transaction(async (tx) => {
          const createdCase = await tx.case.create({
            data: {
              caseNumber,
              passwordHash,
              status: "CONFIRMED",
              initialStatement: input.initialStatement,
              countryCode: input.countryCode,
              type: input.type,
              lastSeenAt: input.lastSeenAt
                ? new Date(input.lastSeenAt)
                : null,
              lastSeenPlace: input.lastSeenPlace,
              discoveredAt: input.discoveredAt
                ? new Date(input.discoveredAt)
                : null,
              discoveredPlace: input.discoveredPlace,
              estimatedOccurredAt: input.estimatedOccurredAt
                ? new Date(input.estimatedOccurredAt)
                : null,
              estimatedOccurredPlace: input.estimatedOccurredPlace,
              routeAfterLastSeen: input.routeAfterLastSeen,
              storageState: input.storageState,
              description: input.description,
              aiSummary: input.aiSummary,
              missingFields:
                input.missingFields === null
                  ? Prisma.DbNull
                  : input.missingFields,
              items: {
                create: input.items.map((item) => ({
                  name: item.name,
                  category: item.category,
                  quantity: item.quantity,
                  brand: item.brand,
                  model: item.model,
                  color: item.color,
                  description: item.description,
                  identifyingFeature: item.identifyingFeature,
                  unauthorizedTransactionOccurred:
                    item.unauthorizedTransactionOccurred,
                  phoneCaseDescription: item.phoneCaseDescription,
                  findMyDeviceAvailable: item.findMyDeviceAvailable,
                  shape: item.shape,
                  contentsDescription: item.contentsDescription,
                  passportDocumentType: item.passportDocumentType,
                  passportNumberKnown: item.passportNumberKnown,
                  departureAt: item.departureAt
                    ? new Date(item.departureAt)
                    : null,
                  cashAmount: item.cashAmount,
                  currency: item.currency,
                  lastSeenAt: item.lastSeenAt
                    ? new Date(item.lastSeenAt)
                    : null,
                  lastSeenPlace: item.lastSeenPlace,
                })),
              },
            },
            select: {
              id: true,
              caseNumber: true,
              type: true,
              status: true,
              countryCode: true,
              initialStatement: true,
              lastSeenAt: true,
              lastSeenPlace: true,
              discoveredAt: true,
              discoveredPlace: true,
              estimatedOccurredAt: true,
              estimatedOccurredPlace: true,
              routeAfterLastSeen: true,
              storageState: true,
              description: true,
              aiSummary: true,
              missingFields: true,
              retentionUntil: true,
              createdAt: true,
              updatedAt: true,
              items: true,
            },
          });

          return createConfirmedCaseSuccessResponseSchema.parse(
            JSON.parse(
              JSON.stringify({
                success: true,
                data: {
                  caseId: createdCase.id,
                  case: createdCase,
                },
              }),
            ),
          );
        });

        return NextResponse.json(
          responseBody,
          { status: 201 },
        );
      } catch (error) {
        if (isCaseNumberConflict(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Error("Case number generation attempts exhausted.");
  } catch (error) {
    console.error("POST /api/cases failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
