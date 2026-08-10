import type { CaseAnalysisResult } from "@project/shared";

export type CaseAnalysisInput = {
  initialStatement: string;
  countryCode: string;
  type: "LOST" | "STOLEN" | "UNKNOWN";
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

  if (input.type === "UNKNOWN") {
    missingFields.push("type");
    questions.push({
      field: "type",
      question:
        "물품을 단순히 잃어버린 것으로 보이나요, 누군가 가져간 정황이 있나요?",
    });
  }

  if (isMissing(input.lastSeenAt)) {
    missingFields.push("lastSeenAt");
    questions.push({
      field: "lastSeenAt",
      question: "분실 물품을 마지막으로 확인한 시간은 언제인가요?",
    });
  }

  if (isMissing(input.lastSeenPlace)) {
    missingFields.push("lastSeenPlace");
    questions.push({
      field: "lastSeenPlace",
      question: "분실 물품을 마지막으로 확인한 장소는 어디인가요?",
    });
  }

  if (isMissing(input.discoveredAt)) {
    missingFields.push("discoveredAt");
    questions.push({
      field: "discoveredAt",
      question: "물품이 없어진 것을 처음 발견한 시간은 언제인가요?",
    });
  }

  if (isMissing(input.discoveredPlace)) {
    missingFields.push("discoveredPlace");
    questions.push({
      field: "discoveredPlace",
      question: "물품이 없어진 것을 처음 발견한 장소는 어디인가요?",
    });
  }

  if (input.items.length === 0) {
    missingFields.push("items");
    questions.push({
      field: "items",
      question: "분실하거나 도난당한 물품이 무엇인지 알려주세요.",
    });
  }

  input.items.forEach((item, index) => {
    if (isMissing(item.color)) {
      missingFields.push(`items[${index}].color`);
      questions.push({
        field: `items[${index}].color`,
        question: `${item.name}의 색상은 무엇인가요?`,
      });
    }

    if (isMissing(item.identifyingFeature)) {
      missingFields.push(`items[${index}].identifyingFeature`);
      questions.push({
        field: `items[${index}].identifyingFeature`,
        question: `${item.name}을 알아볼 수 있는 특징이 있나요?`,
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
