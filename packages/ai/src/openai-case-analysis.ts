// OpenAI를 이용해 사건 정보를 구조화된 형태로 분석하는 함수

import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";

import {
  caseAnalysisResultSchema,
  type CaseAnalysisResult,
} from "@project/shared";

import { getOpenAIClient, getOpenAIModel } from "./client";
import { sanitizeCaseAnalysisInputForAI } from "./pii-boundaries";

import {
  type CaseAnalysisInput,
} from "./case-analysis";

export class AIInvalidResponseError extends Error {
  constructor() {
    super("OpenAI returned an invalid case analysis response.");
    this.name = "AIInvalidResponseError";
  }
}

export class AIAnalysisError extends Error {
  constructor(options?: ErrorOptions) {
    super("OpenAI case analysis failed.", options);
    this.name = "AIAnalysisError";
  }
}

const ANALYSIS_INSTRUCTIONS = [
  "Extract a structured travel lost-property or theft report from the user statement in the JSON input.",
  "Use only facts explicitly stated in initialStatement, existing fields/items, or answers. Never guess. Unknown values must be null.",
  "Before generating questions, extract every explicitly stated incident field and every stated field for each mentioned item. This includes item name, category, quantity, brand, color, model, description, identifying feature, and category-specific fields whenever the statement provides them.",
  "Ask concise natural Korean questions only for information that is still useful for identifying the specific item. Ask category-specific questions only for the matching category; do not ask brand, color, model, or identifying-feature questions for cash or passports.",
  "Classify an explicit loss as LOST, an explicit theft or witnessed theft as STOLEN, otherwise UNKNOWN.",
  "Extract every directly stated incident fact even when other details are unknown. A statement that an item was left on a cafe chair supplies both lastSeenPlace and storageState; a stated theft location supplies estimatedOccurredPlace. Never ask again for a field whose value is explicitly stated in the report.",
  "For today/yesterday and clock times, use the explicitly identified incident location time zone when it is safely known: Japan/Tokyo uses Asia/Tokyo and Korea/Seoul uses Asia/Seoul. Only leave a datetime null when the incident time zone cannot be determined safely.",
  "If the statement names an item, create it and set category: 지갑 is WALLET_BAG, 가방 is WALLET_BAG, 아이폰 is PHONE. Create separate CARD or CASH items only when cards or cash are explicitly stated.",
  "Examples: '검은색 아이폰 15' is a PHONE with brand 'Apple', model 'iPhone 15', and color '검은색'. '검은색 케이스' is phoneCaseDescription. '신용카드 2장' is a CARD with quantity 2. '현금 1만 엔' is a separate CASH item with cashAmount 10000 and currency JPY.",
  "Use referenceTime and the resolved incident time zone for today, yesterday, and relative hours. A stated clock hour remains usable with 쯤 or around. Do not invent a clock time for morning or evening alone.",
  "Map '잃어버린 것을 알았다' or '없어진 것을 알았다' with a stated time/place to discoveredAt/discoveredPlace. Use estimatedOccurredAt/estimatedOccurredPlace only for an explicitly estimated or separately stated occurrence time/place.",
  "Do not use a theft scene as lastSeenAt or lastSeenPlace unless the user explicitly says it was the last sighting. A witnessed theft location belongs to discoveredPlace or estimatedOccurredPlace; keep its time null when only a vague relative day is stated.",
            "For a wallet in a bag with two credit cards and 10,000 yen cash, return a WALLET_BAG item, a CARD item with quantity 2, and a CASH item with cashAmount 10000 and currency JPY.",
            "Existing non-null values and answers are authoritative. Do not include them in missingFields or questions. Questions must be unique, only for unresolved fields, and use consecutive order values from zero.",
  "description is a concise circumstance or clue, not a copy of the whole statement. Keep missingFields exactly aligned with questions.",
  "Write summary exclusively as a natural Korean sentence, regardless of the language used in the input. Do not copy or summarize the input in English, Japanese, or any other language. Proper nouns, brand names, and place names may retain their original spelling when needed, but the surrounding sentence must be Korean.",
  "Return only the requested structured output.",
].join("\n");

// 사건 데이터를 OpenAI에 전달하기 쉬운 JSON 문자열로 변환
function createCaseAnalysisInputText(input: CaseAnalysisInput) {
  return JSON.stringify(
    {
      initialStatement: input.initialStatement,
      countryCode: input.countryCode,
      type: input.type,
      referenceTime: input.referenceTime ?? null,
      timeZone: input.timeZone ?? null,
      lastSeenAt: input.lastSeenAt ?? null,
      lastSeenPlace: input.lastSeenPlace ?? null,
      discoveredAt: input.discoveredAt ?? null,
      discoveredPlace: input.discoveredPlace ?? null,
      estimatedOccurredAt: input.estimatedOccurredAt ?? null,
      estimatedOccurredPlace: input.estimatedOccurredPlace ?? null,
      routeAfterLastSeen: input.routeAfterLastSeen ?? null,
      storageState: input.storageState ?? null,
      description: input.description ?? null,
      items: input.items,
      answers: input.answers,
    },
    null,
    2,
  );
}

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

type ExplicitDetails = Pick<
  CaseAnalysisResult["details"],
  | "type"
  | "lastSeenAt"
  | "lastSeenPlace"
  | "discoveredAt"
  | "discoveredPlace"
  | "estimatedOccurredAt"
  | "estimatedOccurredPlace"
  | "storageState"
>;

function resolveIncidentTimeZone(input: CaseAnalysisInput) {
  const text = `${input.countryCode} ${input.initialStatement}`;
  if (/\bJP\b|Japan|Tokyo|\uC77C\uBCF8|\uB3C4\uCFC4/i.test(text)) return "Asia/Tokyo";
  if (/\bKR\b|Korea|Seoul|\uD55C\uAD6D|\uC11C\uC6B8/i.test(text)) return "Asia/Seoul";
  return null;
}

function localDate(referenceTime: string | undefined, timeZone: string | null) {
  if (!referenceTime || !timeZone || Number.isNaN(Date.parse(referenceTime))) return null;
  const values = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(referenceTime));
  const valueFor = (type: Intl.DateTimeFormatPartTypes) =>
    values.find((part) => part.type === type)?.value;
  const year = valueFor("year");
  const month = valueFor("month");
  const day = valueFor("day");
  return year && month && day ? `${year}-${month}-${day}` : null;
}

function explicitRelativeTime(
  text: string,
  referenceTime: string | undefined,
  timeZone: string | null,
  assumeToday = false,
) {
  const match = text.match(/(\uC624\uB298|\uC5B4\uC81C)?\s*(\uC624\uC804|\uC624\uD6C4)\s*(\d{1,2})\uC2DC(?:\s*(\d{1,2})\uBD84)?(?:\uCBE4|\uACBD|\uB0B4\uC678)?/);
  const today = localDate(referenceTime, timeZone);
  const relativeDay = text.includes("\uC5B4\uC81C") ? "\uC5B4\uC81C" : text.includes("\uC624\uB298") || assumeToday ? "\uC624\uB298" : null;
  if (!match || !today || !relativeDay) return null;
  const date = new Date(`${today}T12:00:00+09:00`);
  if (relativeDay === "\uC5B4\uC81C") date.setUTCDate(date.getUTCDate() - 1);
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: timeZone ?? undefined, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((value) => value.type === type)?.value;
  const resolvedDate = `${part("year")}-${part("month")}-${part("day")}`;

  const isPm = match[2] === "\uC624\uD6C4";
  let hour = Number(match[3]);
  const minute = Number(match[4] ?? "0");
  if (hour < 1 || hour > 12 || minute > 59) return null;
  if (hour === 12) hour = 0;
  if (isPm) hour += 12;
  const offset = timeZone === "Asia/Tokyo" || timeZone === "Asia/Seoul"
    ? "+09:00"
    : null;
  if (!offset) return null;
  return new Date(
    `${resolvedDate}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00${offset}`,
  ).toISOString();
}

function sentenceContaining(statement: string, pattern: RegExp) {
  return statement
    .split(/(?<=[.!?])\s+|[\r\n]+/)
    .find((sentence) => pattern.test(sentence));
}

function explicitStatementFields(statement: string) {
  const fields = new Set<string>();
  if (/\uB3C4\uB09C|\uC808\uB3C4|\uD6D4\uCCD0|\uC18C\uB9E4\uCE58\uAE30|\uBE7C\uC557|\uBD84\uC2E4|\uC783\uC5B4\uBC84|\uC783\uC5C8/.test(statement)) fields.add("type");
  const discovered = sentenceContaining(statement, /\uC5C6\uC5B4\uC9C4\s*\uAC83\uC744|\uC0AC\uB77C\uC9C4\s*\uAC83\uC744|\uC54C\uAC8C\s*\uB410|\uD655\uC778\uD588|\uAE68\uB2EC|\uBC1C\uACAC/);
  if (discovered) {
    if (/(\uC624\uB298|\uC5B4\uC81C)\s*(\uC624\uC804|\uC624\uD6C4)\s*\d{1,2}\uC2DC/.test(discovered)) fields.add("discoveredAt");
    if (/(?:\uC5D0\uC11C|\uADFC\uCC98\uC5D0\uC11C|\uC548\uC5D0\uC11C).*(?:\uC54C|\uD655\uC778|\uAE68\uB2EC|\uBC1C\uACAC)/.test(discovered)) fields.add("discoveredPlace");
  }
  const estimated = sentenceContaining(statement, /\uB3C4\uB09C|\uC808\uB3C4|\uD6D4\uCCD0|\uBE7C\uC557/);
  if (estimated) {
    if (/(\uC624\uB298|\uC5B4\uC81C)\s*(\uC624\uC804|\uC624\uD6C4)\s*\d{1,2}\uC2DC/.test(estimated)) fields.add("estimatedOccurredAt");
    if (/(?:\uC5D0\uC11C|\uADFC\uCC98\uC5D0\uC11C|\uC548\uC5D0\uC11C)/.test(estimated)) fields.add("estimatedOccurredPlace");
  }
  if (/\uB450\uC5C8|\uB193\uC558|\uB193\uC544\uB450|\uC62C\uB824\uB450|\uB123\uC5B4\uB450|\uBCF4\uAD00|\uB9E1\uACA8|\uC8FC\uBA38\uB2C8\uC5D0\s*\uB123/.test(statement)) fields.add("storageState");
  return fields;
}

function mergeKnownDetails(input: CaseAnalysisInput, result: CaseAnalysisResult): CaseAnalysisResult {
  const details = { ...result.details };
  const fields = ["lastSeenAt", "lastSeenPlace", "discoveredAt", "discoveredPlace", "estimatedOccurredAt", "estimatedOccurredPlace", "routeAfterLastSeen", "storageState", "description"] as const;
  for (const field of fields) if (hasValue(input[field])) details[field] = input[field] as never;
  if (input.type !== "UNKNOWN") details.type = input.type;
  for (const answer of input.answers) {
    if (!hasValue(answer.value) || typeof answer.value !== "string") continue;
    if (answer.field === "type" && ["LOST", "STOLEN", "UNKNOWN"].includes(answer.value)) details.type = answer.value as typeof details.type;
    if ((fields as readonly string[]).includes(answer.field)) details[answer.field as typeof fields[number]] = answer.value as never;
  }
  return { ...result, details };
}

export function supplementExplicitCaseDetails(
  input: CaseAnalysisInput,
  result: CaseAnalysisResult,
): CaseAnalysisResult {
  const timeZone = resolveIncidentTimeZone(input);
  const lastSeenSentence = sentenceContaining(input.initialStatement, /\uB450\uC5C8|\uB193\uC558|\uB193\uC544\uB450|\uC62C\uB824\uB450|\uB123\uC5B4\uB450|\uBCF4\uAD00|\uB9E1\uACA8/);
  const discoveredSentence = sentenceContaining(input.initialStatement, /\uC5C6\uC5B4\uC9C4\s*\uAC83\uC744|\uC0AC\uB77C\uC9C4\s*\uAC83\uC744|\uC54C\uAC8C\s*\uB410|\uD655\uC778\uD588|\uAE68\uB2EC|\uBC1C\uACAC/);
  const estimatedSentence = sentenceContaining(input.initialStatement, /\uB3C4\uB09C|\uC808\uB3C4|\uD6D4/);

  const lastSeenPlace = lastSeenSentence
    ?.replace(/^(?:\uC624\uB298\s*)?(?:\uC624\uC804|\uC624\uD6C4)\s*\d{1,2}\uC2DC(?:\s*\d{1,2}\uBD84)?(?:\uCBE4)?\s*/, "")
    .match(/^(.+?)\uC5D0\s+.+?(?:\uB450\uC5C8|\uB193\uC558|\uBCF4\uAD00\uD588)/)?.[1]
    ?.trim();
  const estimatedOccurredPlace = estimatedSentence
    ?.match(/(?:^|\s)(.+?)(?:\uC5D0\uC11C|\uADFC\uCC98\uC5D0\uC11C|\uC548\uC5D0\uC11C)\s+.+?(?:\uB3C4\uB09C|\uC808\uB3C4|\uD6D4)/)?.[1]
    ?.replace(/^(?:\uC624\uB298|\uC5B4\uC81C)\s*(?:\uC624\uC804|\uC624\uD6C4)?\s*\d{0,2}\uC2DC(?:\s*\d{1,2}\uBD84)?(?:\uCBE4)?\s*/, "")
    ?.trim();
  const discoveredPlace = discoveredSentence
    ?.match(/(?:^|\s)(.+?)(?:\uC5D0\uC11C|\uADFC\uCC98\uC5D0\uC11C|\uC548\uC5D0\uC11C)\s+.*?(?:\uC54C|\uD655\uC778|\uAE68\uB2EC|\uBC1C\uACAC)/)?.[1]
    ?.replace(/^(?:\uC624\uB298|\uC5B4\uC81C)\s*(?:\uC624\uC804|\uC624\uD6C4)?\s*\d{0,2}\uC2DC(?:\s*\d{1,2}\uBD84)?(?:\uCBE4)?\s*/, "")
    .trim() ?? null;
  const storageState = lastSeenPlace && /\uC790\uB9AC\uB97C\s+\uBE44\uC6B4/.test(input.initialStatement)
    ? `${lastSeenPlace}\uC5D0 \uB450\uACE0 \uC790\uB9AC\uB97C \uBE44\uC6B4 \uC0C1\uD0DC`
    : lastSeenSentence?.trim() ?? null;
  const type = /\uB3C4\uB09C|\uC808\uB3C4|\uD6D4\uCCD0|\uC18C\uB9E4\uCE58\uAE30|\uBE7C\uC557/.test(input.initialStatement)
    ? "STOLEN"
    : /\uBD84\uC2E4|\uC783\uC5B4\uBC84|\uC783\uC5C8/.test(input.initialStatement) ? "LOST" : "UNKNOWN";

  const explicit: ExplicitDetails = {
    type,
    lastSeenAt: explicitRelativeTime(lastSeenSentence ?? "", input.referenceTime, timeZone, input.initialStatement.includes("\uC624\uB298")),
    lastSeenPlace: lastSeenPlace ?? null,
    discoveredAt: explicitRelativeTime(discoveredSentence ?? "", input.referenceTime, timeZone, input.initialStatement.includes("\uC624\uB298")),
    discoveredPlace,
    estimatedOccurredAt: explicitRelativeTime(estimatedSentence ?? "", input.referenceTime, timeZone, input.initialStatement.includes("\uC624\uB298")),
    estimatedOccurredPlace: estimatedOccurredPlace ?? null,
    storageState,
  };
  const details = { ...result.details };
  for (const [field, value] of Object.entries(explicit) as Array<[keyof ExplicitDetails, string | null]>) {
    if (hasValue(value) && (field !== "type" || value !== "UNKNOWN")) details[field] = value as never;
  }
  return mergeKnownDetails(input, { ...result, details });
}

const fallbackDetailQuestions: Array<{
  field: keyof CaseAnalysisResult["details"];
  question: string;
  answerType: CaseAnalysisResult["questions"][number]["answerType"];
}> = [
  { field: "lastSeenAt", question: "물품을 마지막으로 확인한 시간은 언제인가요?", answerType: "datetime" },
  { field: "lastSeenPlace", question: "물품을 마지막으로 확인한 장소는 어디인가요?", answerType: "text" },
  { field: "discoveredAt", question: "물품이 없어진 것을 알게 된 시간은 언제인가요?", answerType: "datetime" },
  { field: "discoveredPlace", question: "물품이 없어진 것을 알게 된 장소는 어디인가요?", answerType: "text" },
  { field: "estimatedOccurredAt", question: "사건이 발생한 것으로 추정되는 시간은 언제인가요?", answerType: "datetime" },
  { field: "estimatedOccurredPlace", question: "사건이 발생한 것으로 추정되는 장소는 어디인가요?", answerType: "text" },
  { field: "routeAfterLastSeen", question: "마지막 확인 이후 이동한 경로를 순서대로 알려주세요.", answerType: "text" },
  { field: "storageState", question: "사건 당시 물품을 어디에 어떻게 보관하고 있었나요?", answerType: "text" },
];

export function supplementMissingDetailQuestions(input: CaseAnalysisInput, result: CaseAnalysisResult): CaseAnalysisResult {
  const fields = new Set(result.questions.map((question) => question.field));
  const questions = [...result.questions];
  for (const fallback of fallbackDetailQuestions) {
    if (isResolvedQuestionField(fallback.field, input, result) || fields.has(fallback.field)) continue;
    questions.push({
      ...fallback,
      options: [],
      required: false,
      order: questions.length,
    });
  }
  return { ...result, questions };
}

function isResolvedQuestionField(
  field: string,
  input: CaseAnalysisInput,
  result: CaseAnalysisResult,
) {
  if (
    input.answers.some(
      (answer) => answer.field === field && hasValue(answer.value),
    )
  ) {
    return true;
  }

  if (field === "type") return result.details.type !== "UNKNOWN";

  if (explicitStatementFields(input.initialStatement).has(field)) return true;

  if (field in result.details) {
    return hasValue(result.details[field as keyof typeof result.details]);
  }

  const itemField = /^items\[(\d+)]\.(.+)$/.exec(field);
  if (!itemField) return false;

  const item = result.items[Number(itemField[1])];
  return Boolean(
    item && hasValue(item[itemField[2] as keyof typeof item]),
  );
}

function toAnalysisItem(item: CaseAnalysisInput["items"][number]): CaseAnalysisResult["items"][number] {
  return {
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
    departureAt: item.departureAt instanceof Date ? item.departureAt.toISOString() : item.departureAt ?? null,
    cashAmount: item.cashAmount ?? null,
    currency: item.currency ?? null,
    lastSeenAt: item.lastSeenAt instanceof Date ? item.lastSeenAt.toISOString() : item.lastSeenAt ?? null,
    lastSeenPlace: item.lastSeenPlace ?? null,
  };
}

function mergeKnownItems(input: CaseAnalysisInput, resultItems: CaseAnalysisResult["items"]) {
  const items = resultItems.map((item, index) => {
    const knownItem = input.items[index];
    if (!knownItem) return { ...item };
    return {
      ...item,
      ...Object.fromEntries(Object.entries(knownItem).filter(([, value]) => hasValue(value))),
    };
  });
  if (items.length < input.items.length) items.push(...input.items.slice(items.length).map(toAnalysisItem));

  for (const answer of input.answers) {
    const match = /^items\[(\d+)\]\.(name|category|quantity|brand|model|color|description|identifyingFeature|unauthorizedTransactionOccurred|phoneCaseDescription|findMyDeviceAvailable|shape|contentsDescription|passportDocumentType|passportNumberKnown|departureAt|cashAmount|currency|lastSeenAt|lastSeenPlace)$/.exec(answer.field);
    if (!match || !hasValue(answer.value)) continue;
    const item = items[Number(match[1])];
    const field = match[2];
    if (item && field) (item as Record<string, unknown>)[field] = answer.value;
  }
  return items;
}

function isApplicableItemQuestion(field: string, items: CaseAnalysisResult["items"]) {
  const match = /^items\[(\d+)\]\.(.+)$/.exec(field);
  if (!match) return true;
  const item = items[Number(match[1])];
  const itemField = match[2];
  if (!item || !itemField) return true;
  const category = item.category;
  if (["phoneCaseDescription", "findMyDeviceAvailable"].includes(itemField)) return category === "PHONE";
  if (["shape", "contentsDescription"].includes(itemField)) return category === "WALLET_BAG";
  if (itemField === "unauthorizedTransactionOccurred") return category === "CARD";
  if (["passportDocumentType", "passportNumberKnown", "departureAt"].includes(itemField)) return category === "PASSPORT";
  if (["cashAmount", "currency"].includes(itemField)) return category === "CASH";
  if (["brand", "model", "color", "identifyingFeature"].includes(itemField)) return category !== "CASH" && category !== "PASSPORT";
  return true;
}

export function normalizeFollowUpQuestions(
  input: CaseAnalysisInput,
  result: CaseAnalysisResult,
): CaseAnalysisResult {
  const items = result.items.flatMap((item) => {
    if (
      item.category !== "WALLET_BAG" ||
      item.cashAmount === null ||
      item.currency === null
    ) {
      return [item];
    }

    return [
      { ...item, cashAmount: null, currency: null },
      {
        ...item,
        name: "cash",
        category: "CASH",
        quantity: 1,
        brand: null,
        model: null,
        color: null,
        description: null,
        identifyingFeature: null,
        unauthorizedTransactionOccurred: null,
        phoneCaseDescription: null,
        findMyDeviceAvailable: null,
        shape: null,
        contentsDescription: null,
        passportDocumentType: null,
        passportNumberKnown: null,
        departureAt: null,
      },
    ];
  });
  const normalizedResult = { ...result, items: mergeKnownItems(input, items) };
  const seenFields = new Set<string>();
  const questions = result.questions
    .filter((question) => {
      if (seenFields.has(question.field)) return false;
      seenFields.add(question.field);
      return isApplicableItemQuestion(question.field, normalizedResult.items)
        && !isResolvedQuestionField(question.field, input, normalizedResult);
    })
    .map((question, order) => ({ ...question, order }));

  return {
    ...result,
    items: normalizedResult.items,
    missingFields: questions.map((question) => question.field),
    questions,
  };
}

// OpenAI를 이용해 사건 요약, 누락 필드, 추가 질문을 생성
export async function analyzeCaseWithOpenAI(
  input: CaseAnalysisInput,
): Promise<CaseAnalysisResult> {
  const openai = getOpenAIClient();
  const sanitizedInput = await sanitizeCaseAnalysisInputForAI(input);

  let response;

  try {
    response = await openai.responses.parse({
      model: getOpenAIModel(),
      instructions: ANALYSIS_INSTRUCTIONS,

      /* input: [
        {
          role: "system",
          content: [
            "You extract structured facts from a travel lost-property or theft report.",
            "Return only facts explicitly stated by the user, existing case fields, existing items, or prior answers. Never guess or invent a value; use null when it is not known.",
            "Set type to LOST only for an explicit loss statement, STOLEN only for an explicit theft or witnessed theft statement, and UNKNOWN when the report does not establish either.",
            "Use referenceTime and timeZone as the sole anchor for relative Korean time expressions such as today, yesterday, and one hour ago. Return an ISO datetime only when the wording contains a sufficiently exact time; an explicit clock hour remains usable even with 쯤 or around. Do not turn vague phrases such as morning or evening into an invented clock time. If the incident location may be in another time zone and the offset is not explicit, leave the datetime null rather than silently converting it.",
            "When the statement explicitly names an item, always create its item entry. For example, 지갑 means a WALLET_BAG item and 아이폰 15 means a PHONE item. If cards or cash are explicitly described as contents of a wallet or bag, create separate CARD or CASH items only when their count or amount/currency is stated.",
            "For items, extract only stated common and category-specific fields. Keep card, phone, wallet/bag, passport, and cash details on the appropriate item; do not create an unstated item. Preserve an explicitly stated card quantity or cash amount and currency.",
            "Existing fields and answers are authoritative. Do not ask a follow-up question for a field that already has a non-null value in the input or is present in answers. Generate questions only for still-missing required information, with unique fields and consecutive order values starting at zero.",
            "The description is a concise incident circumstance or clue, not an automatic copy of the full initial statement. Return schema-valid structured output only.",
            "너는 해외 여행 중 발생한 분실·도난 사건을 정리하는 AI다.",
            "사용자가 제공한 사건 정보를 분석해 사건 요약, 누락 필드, 추가 질문을 생성한다.",
            "사건 공통 정보는 details에 구조화하고, 물품 정보는 items에 구조화한다.",
            "물품 종류별 추가 정보는 해당 종류일 때만 질문하고 구조화한다.",
            "initialStatement와 기존 items에서 물품 정보를 추출해 items에 구조화한다.",
            "기존 items의 정보는 유지하고, 확인할 수 없는 물품 필드는 null로 반환한다.",
            "물품 수량을 확인할 수 없으면 quantity는 1로 반환한다.",
            "물품을 확인할 수 없으면 items는 빈 배열로 반환한다.",
            "확실하지 않은 정보는 추측하지 않는다.",
            "누락된 정보만 질문으로 만든다.",
            "answers는 이전 추가 질문에 대한 사용자 답변이다. initialStatement, 기존 사건 정보, answers를 모두 함께 반영한다.",
            "type이 UNKNOWN이면 정상 값으로 받아들이고, 추가 질문은 LOST와 같은 기준으로 생성한다.",
            "각 질문에는 입력 종류 answerType, 선택지가 없으면 빈 options, 필수 여부 required, 0부터 시작하는 order를 포함한다.",
            "질문은 사용자가 이해하기 쉬운 한국어로 작성한다.",
          ].join("\n"),
        },
        {
          role: "user",
          content: createCaseAnalysisInputText(input),
        },
      ], */
      input: createCaseAnalysisInputText(sanitizedInput),

      text: {
        format: zodTextFormat(caseAnalysisResultSchema, "case_analysis"),
      },
    });
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError) {
      throw new AIInvalidResponseError();
    }

    throw new AIAnalysisError({ cause: error });
  }

  const parsedResult = caseAnalysisResultSchema.safeParse(
    response.output_parsed,
  );

  if (!parsedResult.success) {
    throw new AIInvalidResponseError();
  }

  return normalizeFollowUpQuestions(
    input,
    supplementMissingDetailQuestions(input,
      supplementExplicitCaseDetails(input, parsedResult.data),
    ),
  );
}
