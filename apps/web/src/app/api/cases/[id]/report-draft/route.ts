import { NextResponse } from "next/server";

import {
  filterValidPoliceReportDraftEdits,
  generatePoliceReportDraft,
  getOpenAIModel,
  isOpenAIConfigured,
  PoliceReportDraftError,
  PoliceReportDraftInputError,
  revisePoliceReportDraft,
} from "@project/ai";
import { prisma } from "@project/db";
import {
  policeReportDraftSuccessResponseSchema,
  revisePoliceReportDraftSchema,
  storedPoliceReportDraftEditsSchema,
  type RevisePoliceReportDraftInput,
} from "@project/shared";

import { authorizeCaseRequest } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthorizedCase(request: Request, id: string) {
  const access = await authorizeCaseRequest(request, id);
  if (!access.ok) return { access } as const;

  const foundCase = await prisma.case.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
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
      items: {
        select: {
          id: true, name: true, category: true, quantity: true, brand: true,
          model: true, color: true, description: true, identifyingFeature: true,
          unauthorizedTransactionOccurred: true, phoneCaseDescription: true,
          findMyDeviceAvailable: true, shape: true, contentsDescription: true,
          passportDocumentType: true, passportNumberKnown: true, departureAt: true,
          cashAmount: true, currency: true, lastSeenAt: true, lastSeenPlace: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  return { access, foundCase } as const;
}

function errorResponse(error: unknown) {
  if (error instanceof PoliceReportDraftInputError) {
    return NextResponse.json({ success: false, error: "INVALID_EDIT" }, { status: 400 });
  }
  if (error instanceof PoliceReportDraftError) {
    return NextResponse.json({ success: false, error: "REPORT_DRAFT_GENERATION_FAILED" }, { status: 502 });
  }
  return NextResponse.json({ success: false, error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
}

function successResponse(draft: Awaited<ReturnType<typeof generatePoliceReportDraft>>) {
  return NextResponse.json(
    policeReportDraftSuccessResponseSchema.parse({
      success: true,
      data: draft,
      meta: { provider: "openai", model: getOpenAIModel(), fallback: false },
    }),
  );
}

export async function readSavedEdits(caseId: string) {
  const document = await prisma.document.findFirst({
    where: { caseId, type: "POLICE_REPORT" },
    orderBy: { updatedAt: "desc" },
    select: { extractedData: true },
  });
  return storedPoliceReportDraftEditsSchema.safeParse(document?.extractedData)
    .data?.edits ?? [];
}

export function mergePoliceReportDraftEdits(
  existing: RevisePoliceReportDraftInput["edits"],
  incoming: RevisePoliceReportDraftInput["edits"],
) {
  const merged = new Map(existing.map((edit) => [edit.key, edit]));
  for (const edit of incoming) merged.set(edit.key, edit);
  return [...merged.values()];
}

export async function saveEdits(caseId: string, edits: RevisePoliceReportDraftInput["edits"]) {
  const existing = await prisma.document.findFirst({
    where: { caseId, type: "POLICE_REPORT" },
    orderBy: { updatedAt: "desc" },
    select: { id: true, extractedData: true },
  });
  const previous = storedPoliceReportDraftEditsSchema.safeParse(existing?.extractedData).data?.edits ?? [];
  const mergedEdits = mergePoliceReportDraftEdits(previous, edits);
  const extractedData = { kind: "POLICE_REPORT_DRAFT_EDITS", version: 1, edits: mergedEdits };
  if (existing) {
    await prisma.document.update({
      where: { id: existing.id },
      data: { extractedData, status: "CONFIRMED", confirmedAt: new Date() },
    });
    return;
  }
  await prisma.document.create({
    data: { caseId, type: "POLICE_REPORT", status: "CONFIRMED", extractedData, confirmedAt: new Date() },
  });
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getAuthorizedCase(request, id);
    if (!result.access.ok) {
      return NextResponse.json({ success: false, error: result.access.error }, { status: result.access.status });
    }
    if (!result.foundCase) {
      return NextResponse.json({ success: false, error: "CASE_NOT_FOUND" }, { status: 404 });
    }
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ success: false, error: "OPENAI_NOT_CONFIGURED" }, { status: 503 });
    }
    const savedEdits = filterValidPoliceReportDraftEdits(
      result.foundCase,
      await readSavedEdits(result.foundCase.id),
    );
    return successResponse(await (
      savedEdits.length > 0
        ? revisePoliceReportDraft(result.foundCase, { edits: savedEdits })
        : generatePoliceReportDraft(result.foundCase)
    ));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const result = await getAuthorizedCase(request, id);
    if (!result.access.ok) {
      return NextResponse.json({ success: false, error: result.access.error }, { status: result.access.status });
    }
    if (!result.foundCase) {
      return NextResponse.json({ success: false, error: "CASE_NOT_FOUND" }, { status: 404 });
    }
    if (!isOpenAIConfigured()) {
      return NextResponse.json({ success: false, error: "OPENAI_NOT_CONFIGURED" }, { status: 503 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "INVALID_JSON" }, { status: 400 });
    }
    const parsed = revisePoliceReportDraftSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "INVALID_INPUT", details: parsed.error.flatten() }, { status: 400 });
    }
    const mergedEdits = mergePoliceReportDraftEdits(
      await readSavedEdits(result.foundCase.id),
      parsed.data.edits,
    );
    const draft = await revisePoliceReportDraft(result.foundCase, { edits: mergedEdits });
    await saveEdits(result.foundCase.id, mergedEdits);
    return successResponse(draft);
  } catch (error) {
    return errorResponse(error);
  }
}
