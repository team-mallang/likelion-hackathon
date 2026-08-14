import { NextResponse } from "next/server";

import {
  analyzeCaseWithMock,
  analyzeCaseWithOpenAIFallback,
  getOpenAIModel,
  isAIMockMode,
  isOpenAIConfigured,
} from "@project/ai";
import {
  analyzeCaseInputSchema,
  caseAnalysisResultSchema,
  caseAnalysisSuccessResponseSchema,
  type AnalyzeCaseInput,
  type CaseAnalysisResult,
} from "@project/shared";

const detailFields = [
  "lastSeenAt", "lastSeenPlace", "discoveredAt", "discoveredPlace",
  "estimatedOccurredAt", "estimatedOccurredPlace", "routeAfterLastSeen",
  "storageState", "description",
] as const;

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function isQuestionAnswered(
  field: string,
  result: CaseAnalysisResult,
  answers: AnalyzeCaseInput["answers"],
) {
  if (answers.some((answer) => answer.field === field && hasValue(answer.value))) return true;
  if (field === "type") return result.details.type !== "UNKNOWN";
  if ((detailFields as readonly string[]).includes(field)) return hasValue(result.details[field as keyof typeof result.details]);

  const match = /^items\[(\d+)]\.(.+)$/.exec(field);
  if (!match) return false;
  const item = result.items[Number(match[1])];
  return Boolean(item && hasValue(item[match[2] as keyof typeof item]));
}

function preserveKnownValues(
  input: AnalyzeCaseInput,
  analysis: CaseAnalysisResult,
): CaseAnalysisResult {
  const details = { ...analysis.details };
  for (const field of detailFields) {
    const value = input[field];
    if (hasValue(value)) details[field] = value as never;
  }
  if (input.type !== "UNKNOWN") details.type = input.type;

  const items = analysis.items.map((item, index) => ({
    ...item,
    ...Object.fromEntries(
      Object.entries(input.items[index] ?? {}).filter(([, value]) => hasValue(value)),
    ),
  }));
  if (items.length < input.items.length) {
    items.push(...input.items.slice(items.length).map((item) => ({
      ...item,
      category: item.category ?? null,
      brand: item.brand ?? null,
      model: item.model ?? null,
      color: item.color ?? null,
      description: item.description ?? null,
      identifyingFeature: item.identifyingFeature ?? null,
      unauthorizedTransactionOccurred: item.unauthorizedTransactionOccurred ?? null,
      phoneCaseDescription: item.phoneCaseDescription ?? null,
      findMyDeviceAvailable: item.findMyDeviceAvailable ?? null,
      shape: item.shape ?? null,
      contentsDescription: item.contentsDescription ?? null,
      passportDocumentType: item.passportDocumentType ?? null,
      passportNumberKnown: item.passportNumberKnown ?? null,
      departureAt: item.departureAt ?? null,
      cashAmount: item.cashAmount ?? null,
      currency: item.currency ?? null,
      lastSeenAt: item.lastSeenAt ?? null,
      lastSeenPlace: item.lastSeenPlace ?? null,
    })));
  }

  const merged = { ...analysis, details, items };
  const questions = merged.questions
    .filter((question) => !isQuestionAnswered(question.field, merged, input.answers))
    .map((question, order) => ({ ...question, order }));

  return { ...merged, questions, missingFields: questions.map((question) => question.field) };
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

    const parsedInput = analyzeCaseInputSchema.safeParse(body);

    if (!parsedInput.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_INPUT",
          details: parsedInput.error.flatten(),
        },
        { status: 400 },
      );
    }

    const provider = isAIMockMode() ? "mock" : "openai";

    if (provider === "openai" && !isOpenAIConfigured()) {
      return NextResponse.json(
        { success: false, error: "AI_PROVIDER_NOT_CONFIGURED" },
        { status: 503 },
      );
    }

    const analysisInput = {
      ...parsedInput.data,
      referenceTime:
        parsedInput.data.referenceTime ?? new Date().toISOString(),
      timeZone: parsedInput.data.timeZone ?? "Asia/Seoul",
    };

    const execution =
      provider === "mock"
        ? {
            result: analyzeCaseWithMock(analysisInput),
            provider: "mock" as const,
            fallbackReason: null,
          }
        : await analyzeCaseWithOpenAIFallback(analysisInput);
    const analysisResult = preserveKnownValues(parsedInput.data, execution.result);
    const parsedAnalysis = caseAnalysisResultSchema.safeParse(
      analysisResult,
    );

    if (!parsedAnalysis.success) {
      return NextResponse.json(
        { success: false, error: "AI_INVALID_RESPONSE" },
        { status: 502 },
      );
    }

    const responseBody = caseAnalysisSuccessResponseSchema.parse({
      success: true,
      data: parsedAnalysis.data,
      meta: {
        provider: execution.provider,
        model: execution.provider === "openai" ? getOpenAIModel() : null,
        ...(execution.fallbackReason
          ? {
              fallback: {
                from: "openai",
                reason: execution.fallbackReason,
              },
            }
          : {}),
      },
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error("POST /api/cases/analyze failed", {
      errorType: error instanceof Error ? error.name : "UnknownError",
    });

    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    );
  }
}
