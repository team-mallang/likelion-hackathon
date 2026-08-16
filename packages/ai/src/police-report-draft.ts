import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  policeReportDraftSchema,
  type PoliceReportDraft,
  type PoliceReportDraftField,
  type RevisePoliceReportDraftInput,
} from "@project/shared";

import { getOpenAIClient, getOpenAIModel } from "./client";

export type ReportCaseItemSource = {
  id: string;
  name: string;
  category: string | null;
  quantity: number;
  brand: string | null;
  model: string | null;
  color: string | null;
  description: string | null;
  identifyingFeature: string | null;
  unauthorizedTransactionOccurred: boolean | null;
  phoneCaseDescription: string | null;
  findMyDeviceAvailable: boolean | null;
  shape: string | null;
  contentsDescription: string | null;
  passportDocumentType: string | null;
  passportNumberKnown: boolean | null;
  departureAt: Date | null;
  cashAmount: number | null;
  currency: string | null;
  lastSeenAt: Date | null;
  lastSeenPlace: string | null;
};

export type ReportCaseSource = {
  id: string;
  type: "LOST" | "STOLEN" | "UNKNOWN";
  initialStatement: string;
  lastSeenAt: Date | null;
  lastSeenPlace: string | null;
  discoveredAt: Date | null;
  discoveredPlace: string | null;
  estimatedOccurredAt: Date | null;
  estimatedOccurredPlace: string | null;
  routeAfterLastSeen: string | null;
  storageState: string | null;
  description: string | null;
  items: ReportCaseItemSource[];
};

const aiReportOutputSchema = z.object({
  fields: z.array(
    z.object({
      key: z.string(),
      valueKo: z.string().nullable(),
      valueJa: z.string().nullable(),
    }),
  ),
  statement: z.object({
    valueKo: z.string().min(1),
    valueJa: z.string().min(1),
  }),
});

type DraftBuild = {
  draft: PoliceReportDraft;
  translationInput: Array<{ key: string; value: string | null }>;
  statementFacts: Record<string, unknown>;
};

const USER_REQUIRED = [
  ["reporter_name", "이름", "氏名", "본인의 이름을 직접 작성하세요.", "ご本人の氏名を記入してください。"],
  ["reporter_phone", "전화번호", "電話番号", "본인의 연락처를 직접 작성하세요.", "ご本人の連絡先を記入してください。"],
  ["reporter_email", "이메일", "メールアドレス", "본인의 이메일을 직접 작성하세요.", "ご本人のメールアドレスを記入してください。"],
  ["reporter_address", "상세 주소", "住所", "본인의 주소를 직접 작성하세요.", "ご本人の住所を記入してください。"],
  ["reporter_signature", "서명", "署名", "본인이 직접 서명하세요.", "ご本人で署名してください。"],
] as const;

function caseField(
  key: string,
  labelKo: string,
  labelJa: string,
  value: string | null,
): PoliceReportDraftField {
  return {
    key,
    labelKo,
    labelJa,
    valueKo: value,
    valueJa: null,
    source: "CASE",
    editable: true,
    ...(value === null
      ? {
          instructionKo: "사건카드에 기록된 값이 없습니다. 사실을 확인해 직접 작성하세요.",
          instructionJa: "事件カードに記録がありません。事実を確認して記入してください。",
        }
      : {}),
  };
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "boolean") return value ? "예" : "아니요";
  return String(value);
}

function itemFields(
  item: ReportCaseItemSource,
  index: number,
  caseLastSeen: Pick<ReportCaseSource, "lastSeenAt" | "lastSeenPlace">,
) {
  const prefix = `item_${index + 1}`;
  const labelPrefixKo = `물품 ${index + 1} - `;
  const labelPrefixJa = `品物 ${index + 1} - `;
  const common = [
    ["name", "이름", "名称", item.name], ["category", "종류", "種類", item.category],
    ["quantity", "수량", "数量", item.quantity], ["brand", "브랜드", "ブランド", item.brand],
    ["model", "모델", "型番・モデル", item.model], ["color", "색상", "色", item.color],
    ["description", "설명", "説明", item.description], ["identifying_feature", "식별 특징", "識別上の特徴", item.identifyingFeature],
    ["last_seen_at", "마지막 확인 시각", "最後に確認した日時", item.lastSeenAt ?? caseLastSeen.lastSeenAt],
    ["last_seen_place", "마지막 확인 장소", "最後に確認した場所", item.lastSeenPlace ?? caseLastSeen.lastSeenPlace],
  ] as const;
  const conditional = item.category === "CARD"
    ? [["unauthorized_transaction_occurred", "무단 결제 발생", "不正利用の有無", item.unauthorizedTransactionOccurred]]
    : item.category === "PHONE"
      ? [["phone_case_description", "휴대폰 케이스", "スマホケース", item.phoneCaseDescription], ["find_my_device_available", "기기 찾기 가능", "端末を探す機能の利用可否", item.findMyDeviceAvailable]]
      : item.category === "WALLET_BAG"
        ? [["shape", "형태", "形状", item.shape], ["contents_description", "내용물", "内容物", item.contentsDescription]]
        : item.category === "PASSPORT"
          ? [["passport_document_type", "여권 문서 종류", "旅券の種類", item.passportDocumentType], ["passport_number_known", "여권번호 인지 여부", "旅券番号を把握しているか", item.passportNumberKnown], ["departure_at", "출국 예정 시각", "出国予定日時", item.departureAt]]
          : item.category === "CASH"
            ? [["cash_amount", "현금 금액", "現金額", item.cashAmount], ["currency", "통화", "通貨", item.currency]]
            : [];
  return [...common, ...conditional].map(([key, labelKo, labelJa, value]) =>
    caseField(`${prefix}_${key}`, `${labelPrefixKo}${labelKo}`, `${labelPrefixJa}${labelJa}`, formatValue(value)),
  );
}

function buildBaseDraft(source: ReportCaseSource): DraftBuild {
  const incidentFields = [
    {
      key: "incident_type",
      labelKo: "사건 유형",
      labelJa: "事案の種類",
      valueKo: { LOST: "분실", STOLEN: "도난", UNKNOWN: "분실 또는 도난 여부 미확정" }[source.type],
      valueJa: { LOST: "遺失", STOLEN: "盗難", UNKNOWN: "遺失・盗難の別は未確定" }[source.type],
      source: "CASE" as const,
      editable: true,
    },
    caseField("discovered_at", "인지 시각", "気付いた日時", formatValue(source.discoveredAt)),
    caseField("discovered_place", "인지 장소", "気付いた場所", source.discoveredPlace),
    caseField("last_seen_at", "마지막 확인 시각", "最後に確認した日時", formatValue(source.lastSeenAt)),
    caseField("last_seen_place", "마지막 확인 장소", "最後に確認した場所", source.lastSeenPlace),
    caseField("estimated_occurred_at", "발생 추정 시각", "発生推定日時", formatValue(source.estimatedOccurredAt)),
    caseField("estimated_occurred_place", "발생 추정 장소", "発生推定場所", source.estimatedOccurredPlace),
    caseField("route_after_last_seen", "마지막 확인 이후 이동 경로", "最後の確認後の移動経路", source.routeAfterLastSeen),
    caseField("storage_state", "보관 상태", "保管状況", source.storageState),
    caseField("case_description", "주요 정황 및 추가 단서", "主な状況・手掛かり", source.description),
  ];
  const itemDetailFields = source.items.flatMap((item, index) =>
    itemFields(item, index, source),
  );
  const draft: PoliceReportDraft = {
    documentType: "POLICE_REPORT",
    caseType: source.type,
    language: { primary: "ja", support: "ko" },
    sections: [
      {
        key: "reporter", titleKo: "신고자 정보", titleJa: "届出者情報",
        fields: USER_REQUIRED.map(([key, labelKo, labelJa, instructionKo, instructionJa]) => ({
          key, labelKo, labelJa, valueKo: null, valueJa: null, source: "USER_REQUIRED" as const,
          editable: true, instructionKo, instructionJa,
        })),
      },
      { key: "incident", titleKo: "사건 정보", titleJa: "事件情報", fields: incidentFields },
      { key: "items", titleKo: "피해 물품", titleJa: "遺失物・被害品", fields: itemDetailFields },
      {
        key: "statement", titleKo: "경위 내용", titleJa: "状況・経緯",
        fields: [{ key: "statement", labelKo: "경위/상세 설명", labelJa: "状況・詳細", valueKo: null, valueJa: null, source: "AI_DRAFT", editable: true }],
      },
    ],
  };
  const translationInput = draft.sections
    .flatMap((section) => section.fields)
    .filter((field) => field.source === "CASE" && field.key !== "incident_type")
    .map((field) => ({ key: field.key, value: field.valueKo }));
  return {
    draft,
    translationInput,
    statementFacts: {
      type: source.type,
      initialStatement: source.initialStatement,
      lastSeenAt: formatValue(source.lastSeenAt), lastSeenPlace: source.lastSeenPlace,
      discoveredAt: formatValue(source.discoveredAt), discoveredPlace: source.discoveredPlace,
      estimatedOccurredAt: formatValue(source.estimatedOccurredAt), estimatedOccurredPlace: source.estimatedOccurredPlace,
      routeAfterLastSeen: source.routeAfterLastSeen, storageState: source.storageState,
      description: source.description,
      items: source.items.map((item) => ({ ...item, departureAt: formatValue(item.departureAt), lastSeenAt: formatValue(item.lastSeenAt) })),
    },
  };
}

/** Exposed for deterministic draft-field tests; does not call the AI provider. */
export function buildPoliceReportDraftBase(source: ReportCaseSource) {
  return buildBaseDraft(source).draft;
}

export function filterValidPoliceReportDraftEdits(
  source: ReportCaseSource,
  edits: RevisePoliceReportDraftInput["edits"],
) {
  const editableKeys = new Set(
    buildBaseDraft(source).draft.sections
      .flatMap((section) => section.fields)
      .filter((field) => field.source !== "USER_REQUIRED" && field.editable)
      .map((field) => field.key),
  );
  return edits.filter((edit) => editableKeys.has(edit.key));
}

function applyEdits(build: DraftBuild, edits: RevisePoliceReportDraftInput["edits"]) {
  const fields = build.draft.sections.flatMap((section) => section.fields);
  const byKey = new Map(fields.map((field) => [field.key, field]));
  for (const edit of edits) {
    const field = byKey.get(edit.key);
    if (!field || field.source === "USER_REQUIRED" || !field.editable) {
      throw new PoliceReportDraftInputError();
    }
    field.valueKo = edit.valueKo;
  }
  const editedKeys = new Set(edits.map((edit) => edit.key));
  build.translationInput = fields
    .filter(
      (field) =>
        field.source === "CASE" &&
        (field.key !== "incident_type" || editedKeys.has(field.key)),
    )
    .map((field) => ({ key: field.key, value: field.valueKo }));
  return { build, editedKeys };
}

const INSTRUCTIONS = [
  "Create bilingual Korean/Japanese support text for a Japanese police report.",
  "Use only the supplied case facts and supplied Korean field values. Do not add, infer, embellish, or repair facts.",
  "For each fields entry, retain the exact key and translate its value to natural Japanese for police-report use. Also return a clear Korean value expressing the same supplied fact. Null must remain null.",
  "Write statement.valueKo and statement.valueJa as concise, respectful chronological incident descriptions based only on statementFacts. If existingStatementKo is supplied, preserve its Korean meaning exactly and translate that text to Japanese rather than adding facts from statementFacts. If a fact is unknown, omit it; never invent date, time, place, person, ownership, or personal data.",
  "Never turn UNKNOWN into loss or theft. Do not create names, telephone numbers, addresses, email addresses, signatures, passport numbers, or any other personal data.",
  "Use cautious wording for estimated/vague facts and preserve uncertainty. Return only schema-valid structured output.",
].join("\n");

export class PoliceReportDraftError extends Error {
  constructor(options?: ErrorOptions) {
    super("OpenAI police report draft generation failed.", options);
    this.name = "PoliceReportDraftError";
  }
}

export class PoliceReportDraftInputError extends Error {
  constructor() {
    super("Invalid police report draft edit.");
    this.name = "PoliceReportDraftInputError";
  }
}

async function generate(
  build: DraftBuild,
  useExistingStatement: boolean,
  editedKeys = new Set<string>(),
) {
  const openai = getOpenAIClient();
  try {
    const response = await openai.responses.parse({
      model: getOpenAIModel(),
      instructions: INSTRUCTIONS,
      input: JSON.stringify({
        fields: build.translationInput,
        statementFacts: build.statementFacts,
        existingStatementKo: useExistingStatement
          ? build.draft.sections.find((section) => section.key === "statement")?.fields[0]?.valueKo ?? null
          : null,
      }),
      text: { format: zodTextFormat(aiReportOutputSchema, "police_report_draft") },
    });
    const parsed = aiReportOutputSchema.safeParse(response.output_parsed);
    if (!parsed.success) throw new PoliceReportDraftError();
    const translations = new Map(parsed.data.fields.map((field) => [field.key, field]));
    for (const field of build.draft.sections.flatMap((section) => section.fields)) {
      if (field.source !== "CASE" || (field.key === "incident_type" && !editedKeys.has(field.key))) continue;
      const translated = translations.get(field.key);
      if (!translated || translated.valueKo === null || translated.valueJa === null) {
        if (field.valueKo !== null) throw new PoliceReportDraftError();
        continue;
      }
      if (!editedKeys.has(field.key)) field.valueKo = translated.valueKo;
      field.valueJa = translated.valueJa;
    }
    const statement = build.draft.sections.find((section) => section.key === "statement")!.fields[0]!;
    statement.valueKo = useExistingStatement && statement.valueKo !== null
      ? statement.valueKo
      : parsed.data.statement.valueKo;
    statement.valueJa = parsed.data.statement.valueJa;
    return policeReportDraftSchema.parse(build.draft);
  } catch (error) {
    if (error instanceof PoliceReportDraftError) throw error;
    throw new PoliceReportDraftError({ cause: error });
  }
}

export async function generatePoliceReportDraft(source: ReportCaseSource) {
  return generate(buildBaseDraft(source), false);
}

export async function revisePoliceReportDraft(
  source: ReportCaseSource,
  input: RevisePoliceReportDraftInput,
) {
  const { build, editedKeys } = applyEdits(buildBaseDraft(source), input.edits);
  return generate(
    build,
    editedKeys.has("statement"),
    editedKeys,
  );
}
