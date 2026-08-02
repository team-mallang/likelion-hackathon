import type { CaseAnalysisResult } from "@project/shared";

export type CaseAnalysisInput = {
  initialStatement: string;
  lastSeenAt?: Date | string | null;
  lastSeenPlace?: string | null;
  discoveredAt?: Date | string | null;
  discoveredPlace?: string | null;
  description?: string | null;
  items: Array<{
    name: string;
    category?: string | null;
    color?: string | null;
    brand?: string | null;
    model?: string | null;
    identifyingFeature?: string | null;
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

  const firstItem = input.items[0];

  if (firstItem && isMissing(firstItem.color)) {
    missingFields.push("items[0].color");
    questions.push({
      field: "items[0].color",
      question: `${firstItem.name}의 색상은 무엇인가요?`,
    });
  }

  if (firstItem && isMissing(firstItem.identifyingFeature)) {
    missingFields.push("items[0].identifyingFeature");
    questions.push({
      field: "items[0].identifyingFeature",
      question: `${firstItem.name}을 알아볼 수 있는 특징이 있나요?`,
    });
  }

  const itemNames =
    input.items.length > 0
      ? input.items.map((item) => item.name).join(", ")
      : "물품";

  return {
    summary: `${input.initialStatement} 관련 물품: ${itemNames}`,
    missingFields,
    questions,
  };
}
