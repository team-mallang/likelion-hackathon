import {
  caseAnalysisAnswerSchema,
  caseInputItemSchema,
  caseTypeSchema,
  type CaseAnalysisAnswer,
  type CreateConfirmedCaseInput,
} from "@project/shared";

import type { CaseDraft } from "@/features/case/types/caseDraft";

const caseStringFields = new Set([
  "lastSeenPlace",
  "discoveredPlace",
  "description",
] as const);
const caseDateFields = new Set(["lastSeenAt", "discoveredAt"] as const);
const itemStringFields = new Set([
  "brand",
  "model",
  "color",
  "description",
  "identifyingFeature",
  "lastSeenPlace",
  "category",
] as const);
const itemFieldPattern =
  /^items\[(\d+)]\.(brand|model|color|description|identifyingFeature|lastSeenAt|lastSeenPlace|quantity|category)$/;

export function applyCaseAnswer(
  draft: CaseDraft,
  answer: CaseAnalysisAnswer,
): CaseDraft {
  const parsedAnswer = caseAnalysisAnswerSchema.safeParse(answer);

  if (!parsedAnswer.success) {
    return draft;
  }

  const nextDraft: CaseDraft = {
    ...draft,
    answers: [
      ...draft.answers.filter(
        (currentAnswer) => currentAnswer.field !== answer.field,
      ),
      answer,
    ],
  };
  const { field, value } = parsedAnswer.data;

  if (caseStringFields.has(field as never) && typeof value === "string") {
    return { ...nextDraft, [field]: value };
  }

  if (
    caseDateFields.has(field as never) &&
    typeof value === "string" &&
    caseInputItemSchema.shape.lastSeenAt.safeParse(value).success
  ) {
    return { ...nextDraft, [field]: value };
  }

  if (field === "type") {
    const parsedType = caseTypeSchema.safeParse(value);
    return parsedType.success
      ? { ...nextDraft, type: parsedType.data }
      : nextDraft;
  }

  const itemFieldMatch = itemFieldPattern.exec(field);

  if (!itemFieldMatch) {
    return nextDraft;
  }

  const itemIndex = Number(itemFieldMatch[1]);
  const itemField = itemFieldMatch[2];
  const currentItem = nextDraft.items[itemIndex];

  if (!currentItem || !itemField) {
    return nextDraft;
  }

  if (itemStringFields.has(itemField as never) && typeof value === "string") {
    return {
      ...nextDraft,
      items: nextDraft.items.map((item, index) =>
        index === itemIndex ? { ...item, [itemField]: value } : item,
      ),
    };
  }

  if (
    itemField === "lastSeenAt" &&
    typeof value === "string" &&
    caseInputItemSchema.shape.lastSeenAt.safeParse(value).success
  ) {
    return {
      ...nextDraft,
      items: nextDraft.items.map((item, index) =>
        index === itemIndex ? { ...item, lastSeenAt: value } : item,
      ),
    };
  }

  if (
    itemField === "quantity" &&
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0
  ) {
    return {
      ...nextDraft,
      items: nextDraft.items.map((item, index) =>
        index === itemIndex ? { ...item, quantity: value } : item,
      ),
    };
  }

  return nextDraft;
}

export function buildConfirmedCaseInput(
  draft: CaseDraft,
  password: string,
): CreateConfirmedCaseInput {
  return {
    initialStatement: draft.initialStatement,
    countryCode: draft.countryCode,
    type: draft.type,
    password,
    lastSeenAt: draft.lastSeenAt,
    lastSeenPlace: draft.lastSeenPlace,
    discoveredAt: draft.discoveredAt,
    discoveredPlace: draft.discoveredPlace,
    description: draft.description,
    aiSummary: draft.aiSummary,
    missingFields: draft.missingFields,
    items: draft.items,
  };
}
