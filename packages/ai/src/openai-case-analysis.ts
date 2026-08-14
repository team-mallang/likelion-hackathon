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
  analyzeCaseWithMock,
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
  "Classify an explicit loss as LOST, an explicit theft or witnessed theft as STOLEN, otherwise UNKNOWN.",
  "If the statement names an item, create it and set category: 지갑 is WALLET_BAG, 가방 is WALLET_BAG, 아이폰 is PHONE. Create separate CARD or CASH items only when cards or cash are explicitly stated.",
  "Examples: '검은색 아이폰 15' is a PHONE with brand 'Apple', model 'iPhone 15', and color '검은색'. '검은색 케이스' is phoneCaseDescription. '신용카드 2장' is a CARD with quantity 2. '현금 1만 엔' is a separate CASH item with cashAmount 10000 and currency JPY.",
  "Use referenceTime and timeZone for today, yesterday, and relative hours. A stated clock hour remains usable with 쯤 or around. Do not invent a clock time for morning or evening alone. If a location might use another time zone and no offset is given, leave the datetime null.",
  "Map '잃어버린 것을 알았다' or '없어진 것을 알았다' with a stated time/place to discoveredAt/discoveredPlace. Use estimatedOccurredAt/estimatedOccurredPlace only for an explicitly estimated or separately stated occurrence time/place.",
  "Do not use a theft scene as lastSeenAt or lastSeenPlace unless the user explicitly says it was the last sighting. A witnessed theft location belongs to discoveredPlace or estimatedOccurredPlace; keep its time null when only a vague relative day is stated.",
            "For a wallet in a bag with two credit cards and 10,000 yen cash, return a WALLET_BAG item, a CARD item with quantity 2, and a CASH item with cashAmount 10000 and currency JPY.",
            "Existing non-null values and answers are authoritative. Do not include them in missingFields or questions. Questions must be unique, only for unresolved fields, and use consecutive order values from zero.",
  "description is a concise circumstance or clue, not a copy of the whole statement. Keep missingFields exactly aligned with questions.",
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

function normalizeFollowUpQuestions(
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
  const quantityAnswers = items.flatMap((item, index) =>
    item.quantity === 1
      ? []
      : [{ field: `items[${index}].quantity`, value: item.quantity }],
  );
  const extractedInput: CaseAnalysisInput = {
    ...input,
    ...result.details,
    items,
    answers: [...input.answers, ...quantityAnswers],
  };
  const followUp = analyzeCaseWithMock(extractedInput);
  const knownFields = new Set(input.answers.map((answer) => answer.field));
  const questions = followUp.questions
    .filter((question) => !knownFields.has(question.field))
    .map((question, order) => ({ ...question, order }));

  return {
    ...result,
    items,
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

  return normalizeFollowUpQuestions(input, parsedResult.data);
}
