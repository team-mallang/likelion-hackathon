import type {
  CaseAnalysisAnswer,
  CaseAnalysisResult,
  CaseType,
  PassportDocumentType,
} from "@project/shared";

export type CaseAnalysisInput = {
  initialStatement: string;
  countryCode: string;
  type: CaseType;
  referenceTime?: string;
  timeZone?: string;
  lastSeenAt?: Date | string | null;
  lastSeenPlace?: string | null;
  discoveredAt?: Date | string | null;
  discoveredPlace?: string | null;
  estimatedOccurredAt?: Date | string | null;
  estimatedOccurredPlace?: string | null;
  routeAfterLastSeen?: string | null;
  storageState?: string | null;
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
    unauthorizedTransactionOccurred?: boolean | null;
    phoneCaseDescription?: string | null;
    findMyDeviceAvailable?: boolean | null;
    shape?: string | null;
    contentsDescription?: string | null;
    passportDocumentType?: PassportDocumentType | null;
    passportNumberKnown?: boolean | null;
    departureAt?: Date | string | null;
    cashAmount?: number | null;
    currency?: string | null;
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

function toISOString(value: Date | string | null | undefined) {
  return value instanceof Date ? value.toISOString() : value ?? null;
}

function createKoreanSummary(input: CaseAnalysisInput) {
  const incident = input.type === "STOLEN"
    ? "도난 신고가 접수되었습니다"
    : input.type === "LOST"
      ? "분실 신고가 접수되었습니다"
      : "물품 분실 또는 도난 신고가 접수되었습니다";
  const itemNames = input.items.map((item) => item.name).filter(Boolean);

  return itemNames.length > 0
    ? `${incident}. 관련 물품은 ${itemNames.join(", ")}입니다.`
    : incident;
}

type ItemKind = "CARD" | "PHONE" | "WALLET_BAG" | "PASSPORT" | "CASH" | "OTHER";

function getItemKind(name: string, category?: string | null): ItemKind {
  const value = `${name} ${category ?? ""}`.toLowerCase();

  if (/card|카드/.test(value)) return "CARD";
  if (/phone|smartphone|휴대폰|핸드폰|스마트폰/.test(value)) return "PHONE";
  if (/wallet|bag|지갑|가방/.test(value)) return "WALLET_BAG";
  if (/passport|여권/.test(value)) return "PASSPORT";
  if (/cash|money|현금/.test(value)) return "CASH";
  return "OTHER";
}

export function analyzeCaseWithMock(input: CaseAnalysisInput): CaseAnalysisResult {
  const missingFields: string[] = [];
  const questions: CaseAnalysisResult["questions"] = [];
  const answeredFields = new Set(input.answers.map((answer) => answer.field));

  function ask(
    field: string,
    question: string,
    answerType: CaseAnalysisResult["questions"][number]["answerType"] = "text",
    options: string[] = [],
  ) {
    if (answeredFields.has(field)) return;
    missingFields.push(field);
    questions.push({ field, question, answerType, options, required: true, order: questions.length });
  }

  if (isMissing(input.lastSeenAt)) ask("lastSeenAt", "물품을 마지막으로 확인한 시간은 언제인가요?", "datetime");
  if (isMissing(input.lastSeenPlace)) ask("lastSeenPlace", "물품을 마지막으로 확인한 장소는 어디인가요?");
  if (isMissing(input.discoveredAt)) ask("discoveredAt", "물품이 없어진 것을 인지한 시간은 언제인가요?", "datetime");
  if (isMissing(input.discoveredPlace)) ask("discoveredPlace", "물품이 없어진 것을 인지한 장소는 어디인가요?");
  if (isMissing(input.estimatedOccurredAt)) ask("estimatedOccurredAt", "사건이 발생한 것으로 추정되는 시간은 언제인가요?", "datetime");
  if (isMissing(input.estimatedOccurredPlace)) ask("estimatedOccurredPlace", "사건이 발생한 것으로 추정되는 장소는 어디인가요?");
  if (isMissing(input.routeAfterLastSeen)) ask("routeAfterLastSeen", "마지막 확인 이후 이동한 경로를 순서대로 알려주세요.");
  if (isMissing(input.storageState)) ask("storageState", "사건 당시 물품을 어디에 어떻게 보관하고 있었나요?");
  if (isMissing(input.description)) ask("description", "물품이 없어진 전후의 주요 정황이나 추가 단서를 알려주세요.");

  if (input.items.length === 0) {
    ask("items[0].name", "대표 분실·도난 물품은 무엇인가요?");
  }

  input.items.forEach((item, index) => {
    const prefix = `items[${index}]`;
    const kind = getItemKind(item.name, item.category);

    if (isMissing(item.category)) {
      ask(`${prefix}.category`, `${item.name}의 물품 종류를 선택해 주세요.`, "select", [
        "CARD", "PHONE", "WALLET_BAG", "PASSPORT", "CASH", "OTHER",
      ]);
      return;
    }

    if (kind !== "PASSPORT" && kind !== "CASH" && isMissing(item.color)) {
      ask(`${prefix}.color`, `${item.name}의 색상은 무엇인가요?`);
    }
    if (kind !== "PASSPORT" && kind !== "CASH" && isMissing(item.brand)) {
      ask(`${prefix}.brand`, `${item.name}의 브랜드·제조사·카드사를 알려주세요.`);
    }
    if (isMissing(item.identifyingFeature)) {
      ask(`${prefix}.identifyingFeature`, `${item.name}을 식별할 수 있는 특징을 알려주세요.`);
    }

    if (kind === "CARD") {
      if (!answeredFields.has(`${prefix}.quantity`)) ask(`${prefix}.quantity`, "없어진 카드 수량은 몇 장인가요?", "number");
      if (isMissing(item.unauthorizedTransactionOccurred)) ask(`${prefix}.unauthorizedTransactionOccurred`, "본인이 사용하지 않은 결제 내역이 있나요?", "boolean");
    }

    if (kind === "PHONE") {
      if (isMissing(item.model)) ask(`${prefix}.model`, "휴대폰 모델명은 무엇인가요?");
      if (isMissing(item.phoneCaseDescription)) ask(`${prefix}.phoneCaseDescription`, "휴대폰 케이스의 색상과 특징을 알려주세요.");
      if (isMissing(item.findMyDeviceAvailable)) ask(`${prefix}.findMyDeviceAvailable`, "기기 찾기 기능을 사용할 수 있나요?", "boolean");
    }

    if (kind === "WALLET_BAG") {
      if (isMissing(item.shape)) ask(`${prefix}.shape`, `${item.name}의 형태를 알려주세요.`);
      if (isMissing(item.contentsDescription)) ask(`${prefix}.contentsDescription`, `${item.name} 안에 있던 주요 물품을 알려주세요.`);
    }

    if (kind === "PASSPORT") {
      if (isMissing(item.passportDocumentType)) ask(`${prefix}.passportDocumentType`, "없어진 여권은 원본인가요, 사본인가요?", "select", ["ORIGINAL", "COPY", "BOTH", "UNKNOWN"]);
      if (isMissing(item.passportNumberKnown)) ask(`${prefix}.passportNumberKnown`, "여권번호를 알고 있나요?", "boolean");
      if (isMissing(item.departureAt)) ask(`${prefix}.departureAt`, "출국 예정일은 언제인가요?", "datetime");
    }

    if (kind === "CASH") {
      if (isMissing(item.cashAmount)) ask(`${prefix}.cashAmount`, "현금의 대략적인 금액은 얼마인가요?", "number");
      if (isMissing(item.currency)) ask(`${prefix}.currency`, "현금 통화의 3자리 코드를 알려주세요. 예: JPY");
    }
  });

  return {
    summary: createKoreanSummary(input),
    details: {
      type: input.type,
      lastSeenAt: toISOString(input.lastSeenAt),
      lastSeenPlace: input.lastSeenPlace ?? null,
      discoveredAt: toISOString(input.discoveredAt),
      discoveredPlace: input.discoveredPlace ?? null,
      estimatedOccurredAt: toISOString(input.estimatedOccurredAt),
      estimatedOccurredPlace: input.estimatedOccurredPlace ?? null,
      routeAfterLastSeen: input.routeAfterLastSeen ?? null,
      storageState: input.storageState ?? null,
      description: input.description ?? null,
    },
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
      unauthorizedTransactionOccurred: item.unauthorizedTransactionOccurred ?? null,
      phoneCaseDescription: item.phoneCaseDescription ?? null,
      findMyDeviceAvailable: item.findMyDeviceAvailable ?? null,
      shape: item.shape ?? null,
      contentsDescription: item.contentsDescription ?? null,
      passportDocumentType: item.passportDocumentType ?? null,
      passportNumberKnown: item.passportNumberKnown ?? null,
      departureAt: toISOString(item.departureAt),
      cashAmount: item.cashAmount ?? null,
      currency: item.currency ?? null,
      lastSeenAt: toISOString(item.lastSeenAt),
      lastSeenPlace: item.lastSeenPlace ?? null,
    })),
  };
}
