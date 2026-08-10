import type {
  CaseAnalysisAnswer,
  CaseAnalysisResult,
  CaseType,
} from "@project/shared";

export type CaseAnalysisInput = {
  initialStatement: string;
  countryCode: string;
  type: CaseType;
  lastSeenAt?: Date | string | null;
  lastSeenPlace?: string | null;
  discoveredAt?: Date | string | null;
  discoveredPlace?: string | null;
  description?: string | null;
  items: Array<{
    name: string;
    category?: string | null;
    quantity: number;
    color?: string | null;
    brand?: string | null;
    model?: string | null;
    description?: string | null;
    identifyingFeature?: string | null;
    lastSeenAt?: Date | string | null;
    lastSeenPlace?: string | null;
  }>;
  answers: CaseAnalysisAnswer[];
};

function isMissing(value: unknown) {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim().length === 0)
  );
}

export function analyzeCaseWithMock(
  input: CaseAnalysisInput,
): CaseAnalysisResult {
  const missingFields: string[] = [];
  const questions: CaseAnalysisResult["questions"] = [];
  const answeredFields = new Set(input.answers.map((answer) => answer.field));

  if (isMissing(input.lastSeenAt) && !answeredFields.has("lastSeenAt")) {
    missingFields.push("lastSeenAt");
    questions.push({
      field: "lastSeenAt",
      question: "분실 물품을 마지막으로 확인한 시간은 언제인가요?",
      answerType: "datetime",
      options: [],
      required: true,
      order: questions.length,
    });
  }

  if (isMissing(input.lastSeenPlace) && !answeredFields.has("lastSeenPlace")) {
    missingFields.push("lastSeenPlace");
    questions.push({
      field: "lastSeenPlace",
      question: "분실 물품을 마지막으로 확인한 장소는 어디인가요?",
      answerType: "text",
      options: [],
      required: true,
      order: questions.length,
    });
  }

  if (isMissing(input.discoveredAt) && !answeredFields.has("discoveredAt")) {
    missingFields.push("discoveredAt");
    questions.push({
      field: "discoveredAt",
      question: "물품이 없어진 것을 처음 발견한 시간은 언제인가요?",
      answerType: "datetime",
      options: [],
      required: true,
      order: questions.length,
    });
  }

  if (
    isMissing(input.discoveredPlace) &&
    !answeredFields.has("discoveredPlace")
  ) {
    missingFields.push("discoveredPlace");
    questions.push({
      field: "discoveredPlace",
      question: "물품이 없어진 것을 처음 발견한 장소는 어디인가요?",
      answerType: "text",
      options: [],
      required: true,
      order: questions.length,
    });
  }

  if (input.items.length === 0 && !answeredFields.has("items")) {
    missingFields.push("items");
    questions.push({
      field: "items",
      question: "분실하거나 도난당한 물품이 무엇인지 알려주세요.",
      answerType: "text",
      options: [],
      required: true,
      order: questions.length,
    });
  }

  input.items.forEach((item, index) => {
    if (
      isMissing(item.color) &&
      !answeredFields.has(`items[${index}].color`)
    ) {
      missingFields.push(`items[${index}].color`);
      questions.push({
        field: `items[${index}].color`,
        question: `${item.name}의 색상은 무엇인가요?`,
        answerType: "text",
        options: [],
        required: true,
        order: questions.length,
      });
    }

    if (
      isMissing(item.identifyingFeature) &&
      !answeredFields.has(`items[${index}].identifyingFeature`)
    ) {
      missingFields.push(`items[${index}].identifyingFeature`);
      questions.push({
        field: `items[${index}].identifyingFeature`,
        question: `${item.name}을 알아볼 수 있는 특징이 있나요?`,
        answerType: "text",
        options: [],
        required: true,
        order: questions.length,
      });
    }
  });

  const itemNames =
    input.items.length > 0
      ? input.items.map((item) => item.name).join(", ")
      : "물품";

  return {
    summary: `${input.initialStatement} 관련 물품: ${itemNames}`,
    missingFields,
    questions,
    items: input.items.map((item) => ({
      name: item.name,
      category: item.category ?? null,
      quantity: item.quantity,
      brand: item.brand ?? null,
      model: item.model ?? null,
      color: item.color ?? null,
      description: item.description ?? null,
      identifyingFeature: item.identifyingFeature ?? null,
      lastSeenAt:
        item.lastSeenAt instanceof Date
          ? item.lastSeenAt.toISOString()
          : item.lastSeenAt ?? null,
      lastSeenPlace: item.lastSeenPlace ?? null,
    })),
  };
}
