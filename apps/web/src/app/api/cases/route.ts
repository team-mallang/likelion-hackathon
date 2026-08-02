import { NextResponse } from "next/server";

import { prisma } from "@project/db";
import { createCaseSchema } from "@project/shared";

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
    const parsed = createCaseSchema.safeParse(body);

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

    const createdCase = await prisma.case.create({
      data: {
        initialStatement: input.initialStatement,
        type: input.type,

        lastSeenAt: input.lastSeenAt
          ? new Date(input.lastSeenAt)
          : undefined,
        lastSeenPlace: input.lastSeenPlace,

        discoveredAt: input.discoveredAt
          ? new Date(input.discoveredAt)
          : undefined,
        discoveredPlace: input.discoveredPlace,

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
            lastSeenAt: item.lastSeenAt
              ? new Date(item.lastSeenAt)
              : undefined,
            lastSeenPlace: item.lastSeenPlace,
          })),
        },
      },
      include: {
        items: true,
        travelerContext: true,
        theftDetail: true,
        guideSteps: true,
      },
    });

    const { passwordHash: _passwordHash, ...safeCase } = createdCase;

    return NextResponse.json(
      {
        success: true,
        data: safeCase,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/cases error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}
