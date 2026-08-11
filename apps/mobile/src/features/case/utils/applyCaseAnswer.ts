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
  "estimatedOccurredPlace",
  "routeAfterLastSeen",
  "storageState",
  "description",
] as const);
const caseDateFields = new Set([
  "lastSeenAt",
  "discoveredAt",
  "estimatedOccurredAt",
] as const);
const itemStringFields = new Set([
  "name",
  "brand",
  "model",
  "color",
  "description",
  "identifyingFeature",
  "lastSeenPlace",
  "category",
  "phoneCaseDescription",
  "shape",
  "contentsDescription",
] as const);
const itemBooleanFields = new Set([
  "unauthorizedTransactionOccurred",
  "findMyDeviceAvailable",
  "passportNumberKnown",
] as const);
const itemFieldPattern =
  /^items\[(\d+)]\.(name|brand|model|color|description|identifyingFeature|lastSeenAt|lastSeenPlace|quantity|category|unauthorizedTransactionOccurred|phoneCaseDescription|findMyDeviceAvailable|shape|contentsDescription|passportDocumentType|passportNumberKnown|departureAt|cashAmount|currency)$/;

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
  let items = nextDraft.items;

  if (
    itemIndex === items.length &&
    itemField === "name" &&
    typeof value === "string"
  ) {
    items = [...items, { name: value, quantity: 1 }];
    return { ...nextDraft, items };
  }

  const currentItem = items[itemIndex];

  if (!currentItem || !itemField) {
    return nextDraft;
  }

  if (itemStringFields.has(itemField as never) && typeof value === "string") {
    return {
      ...nextDraft,
      items: items.map((item, index) =>
        index === itemIndex ? { ...item, [itemField]: value } : item,
      ),
    };
  }

  if (
    (itemField === "lastSeenAt" || itemField === "departureAt") &&
    typeof value === "string" &&
    caseInputItemSchema.shape.lastSeenAt.safeParse(value).success
  ) {
    return {
      ...nextDraft,
      items: items.map((item, index) =>
        index === itemIndex ? { ...item, [itemField]: value } : item,
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
      items: items.map((item, index) =>
        index === itemIndex ? { ...item, quantity: value } : item,
      ),
    };
  }

  if (itemField === "cashAmount" && typeof value === "number" && value >= 0) {
    return {
      ...nextDraft,
      items: items.map((item, index) =>
        index === itemIndex ? { ...item, cashAmount: value } : item,
      ),
    };
  }

  if (itemBooleanFields.has(itemField as never) && typeof value === "boolean") {
    return {
      ...nextDraft,
      items: items.map((item, index) =>
        index === itemIndex ? { ...item, [itemField]: value } : item,
      ),
    };
  }

  if (itemField === "passportDocumentType") {
    const parsed = caseInputItemSchema.shape.passportDocumentType.safeParse(value);
    return parsed.success
      ? {
          ...nextDraft,
          items: items.map((item, index) =>
            index === itemIndex
              ? { ...item, passportDocumentType: parsed.data }
              : item,
          ),
        }
      : nextDraft;
  }

  if (itemField === "currency" && typeof value === "string") {
    const currency = value.toUpperCase();
    return caseInputItemSchema.shape.currency.safeParse(currency).success
      ? {
          ...nextDraft,
          items: items.map((item, index) =>
            index === itemIndex ? { ...item, currency } : item,
          ),
        }
      : nextDraft;
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
    estimatedOccurredAt: draft.estimatedOccurredAt,
    estimatedOccurredPlace: draft.estimatedOccurredPlace,
    routeAfterLastSeen: draft.routeAfterLastSeen,
    storageState: draft.storageState,
    description: draft.description,
    aiSummary: draft.aiSummary,
    missingFields: draft.missingFields,
    items: draft.items,
  };
}
