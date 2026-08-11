import {
  PoliceReportServiceError,
  type PoliceReportService,
} from "@/features/police-report/services/policeReport";
import type {
  LocalizedText,
  PoliceReportDraft,
  PoliceReportField,
  PoliceReportItem,
} from "@/features/police-report/types/policeReport";

export type MockPoliceReportOptions = {
  delayMs?: number;
  failGetRequest?: boolean;
  failRegeneration?: boolean;
  staleDraft?: boolean;
  missingRequiredFields?: boolean;
  emptyItems?: boolean;
  longNarrative?: boolean;
};

const DEFAULT_DELAY_MS = 300;
const CURRENT_SOURCE_REVISION = "case-revision-2";
const STALE_SOURCE_REVISION = "case-revision-1";

const standardNarrative: LocalizedText = {
  ja: "財布はリュックサックの外側のポケットに入れていました。人混みの中を歩いており、誰かと軽くぶつかった記憶がありますが、その時は気づきませんでした。10分後にカフェで支払いをしようとした際に、財布がないことに気づきました。",
  ko: "지갑은 배낭 바깥쪽 주머니에 넣어 두었습니다. 사람이 많은 곳을 걷던 중 누군가와 가볍게 부딪힌 기억이 있지만 당시에는 알아차리지 못했습니다. 10분 뒤 카페에서 결제하려다 지갑이 없어진 것을 알았습니다.",
};

const extendedNarrative: LocalizedText = {
  ja: `${standardNarrative.ja} その後、歩いてきた道と立ち寄った場所を確認しましたが、財布を見つけることはできませんでした。財布には現金、クレジットカード、身分証明書が入っていました。`,
  ko: `${standardNarrative.ko} 이후 지나온 길과 들렀던 장소를 확인했지만 지갑을 찾지 못했습니다. 지갑에는 현금, 신용카드와 신분증이 들어 있었습니다.`,
};

const applicantFields: PoliceReportField[] = [
  {
    id: "applicant-name",
    label: { ja: "氏名", ko: "성명" },
    value: {
      ja: "홍길동 (ホン・ギルドン)",
      ko: "홍길동 (일본어 표기: ホン・ギルドン)",
    },
    required: true,
    missing: false,
  },
  {
    id: "applicant-contact",
    label: { ja: "連絡先", ko: "연락처" },
    value: { ja: "010-1234-5678", ko: "010-1234-5678" },
    required: true,
    missing: false,
  },
];

const incidentFields: PoliceReportField[] = [
  {
    id: "incident-occurred-at",
    label: { ja: "被害日時", ko: "피해 일시" },
    value: {
      ja: "2023年 10月 25日 午後 3時頃",
      ko: "2023년 10월 25일 오후 3시경",
    },
    required: true,
    missing: false,
  },
  {
    id: "incident-location",
    label: { ja: "被害場所", ko: "피해 장소" },
    value: {
      ja: "東京都 渋谷区 渋谷スクランブル交差点付近",
      ko: "도쿄도 시부야구 시부야 스크램블 교차로 부근",
    },
    required: true,
    missing: false,
  },
];

const items: PoliceReportItem[] = [
  {
    id: "lost-item-wallet",
    order: 1,
    title: { ja: "黒の革財布", ko: "검은색 가죽 지갑" },
    details: [
      {
        id: "lost-item-wallet-brand-value",
        text: {
          ja: "ブランド: Prada / 時価: 約50,000円",
          ko: "브랜드: Prada / 시가: 약 50,000엔",
        },
      },
    ],
  },
  {
    id: "lost-item-cash",
    order: 2,
    title: { ja: "現金", ko: "현금" },
    details: [
      {
        id: "lost-item-cash-value",
        text: { ja: "日本円 約30,000円", ko: "일본 엔화 약 30,000엔" },
      },
    ],
  },
  {
    id: "lost-item-credit-card",
    order: 3,
    title: { ja: "クレジットカード", ko: "신용카드" },
    details: [
      {
        id: "lost-item-credit-card-issuer",
        text: {
          ja: "Visa (国民銀行) 1枚",
          ko: "Visa (국민은행) 1장",
        },
      },
    ],
  },
];

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, delayMs));
  });
}

function cloneLocalizedText(value: LocalizedText): LocalizedText {
  return { ...value };
}

function cloneField(field: PoliceReportField): PoliceReportField {
  return {
    ...field,
    label: cloneLocalizedText(field.label),
    value: cloneLocalizedText(field.value),
  };
}

function cloneItem(item: PoliceReportItem): PoliceReportItem {
  return {
    ...item,
    title: cloneLocalizedText(item.title),
    details: item.details.map((detail) => ({
      ...detail,
      text: cloneLocalizedText(detail.text),
    })),
  };
}

function cloneDraft(draft: PoliceReportDraft): PoliceReportDraft {
  return {
    ...draft,
    applicantFields: draft.applicantFields.map(cloneField),
    incidentFields: draft.incidentFields.map(cloneField),
    items: draft.items.map(cloneItem),
    narrative: cloneLocalizedText(draft.narrative),
    missingFieldIds: [...draft.missingFieldIds],
  };
}

function createDraft(
  caseId: string,
  options: MockPoliceReportOptions,
): PoliceReportDraft {
  const nextApplicantFields = applicantFields.map(cloneField);
  const nextIncidentFields = incidentFields.map(cloneField);
  const missingFieldIds: string[] = [];

  if (options.missingRequiredFields) {
    const contact = nextApplicantFields.find(
      (field) => field.id === "applicant-contact",
    );
    const location = nextIncidentFields.find(
      (field) => field.id === "incident-location",
    );

    for (const field of [contact, location]) {
      if (!field) {
        continue;
      }

      field.value = { ja: "", ko: "" };
      field.missing = true;
      missingFieldIds.push(field.id);
    }
  }

  return {
    draftId: `mock-report-${caseId}`,
    caseId,
    version: 1,
    sourceRevision: options.staleDraft
      ? STALE_SOURCE_REVISION
      : CURRENT_SOURCE_REVISION,
    status: options.staleDraft ? "STALE" : "READY",
    applicantFields: nextApplicantFields,
    incidentFields: nextIncidentFields,
    items: options.emptyItems ? [] : items.map(cloneItem),
    narrative: cloneLocalizedText(
      options.longNarrative ? extendedNarrative : standardNarrative,
    ),
    missingFieldIds,
  };
}

function assertCaseId(caseId: string) {
  if (!caseId.trim()) {
    throw new PoliceReportServiceError(
      "INVALID_CASE_ID",
      "신고서 초안을 만들 활성 사건이 없습니다.",
    );
  }
}

export function createMockPoliceReportService(
  options: MockPoliceReportOptions = {},
): PoliceReportService {
  let currentDraft: PoliceReportDraft | null = null;

  return {
    async getOrCreateDraft({ caseId }) {
      await wait(options.delayMs ?? DEFAULT_DELAY_MS);
      assertCaseId(caseId);

      if (options.failGetRequest) {
        throw new PoliceReportServiceError(
          "GENERATION_FAILED",
          "신고서 초안을 만들지 못했습니다. 다시 시도해 주세요.",
        );
      }

      currentDraft ??= createDraft(caseId, options);

      if (currentDraft.caseId !== caseId) {
        currentDraft = createDraft(caseId, options);
      }

      return cloneDraft(currentDraft);
    },

    async regenerateDraft({ caseId, draftId, sourceRevision }) {
      await wait(options.delayMs ?? DEFAULT_DELAY_MS);
      assertCaseId(caseId);

      if (options.failRegeneration) {
        throw new PoliceReportServiceError(
          "GENERATION_FAILED",
          "변경된 사건 정보로 신고서 초안을 다시 만들지 못했습니다.",
        );
      }

      if (
        !currentDraft ||
        currentDraft.caseId !== caseId ||
        currentDraft.draftId !== draftId
      ) {
        throw new PoliceReportServiceError(
          "DRAFT_NOT_FOUND",
          "다시 만들 신고서 초안을 찾을 수 없습니다.",
        );
      }

      if (currentDraft.sourceRevision !== sourceRevision) {
        throw new PoliceReportServiceError(
          "SOURCE_REVISION_MISMATCH",
          "사건 정보가 다시 변경되었습니다. 최신 내용을 불러와 주세요.",
        );
      }

      currentDraft = {
        ...createDraft(caseId, {
          ...options,
          staleDraft: false,
        }),
        draftId: currentDraft.draftId,
        version: currentDraft.version + 1,
        sourceRevision: CURRENT_SOURCE_REVISION,
      };

      return cloneDraft(currentDraft);
    },

    async createExport({ caseId, draftId, version }) {
      await wait(options.delayMs ?? DEFAULT_DELAY_MS);
      assertCaseId(caseId);

      if (
        !currentDraft ||
        currentDraft.caseId !== caseId ||
        currentDraft.draftId !== draftId ||
        currentDraft.version !== version
      ) {
        throw new PoliceReportServiceError(
          "DRAFT_NOT_FOUND",
          "저장할 신고서 초안을 찾을 수 없습니다.",
        );
      }

      if (currentDraft.missingFieldIds.length > 0) {
        throw new PoliceReportServiceError(
          "REQUIRED_INFORMATION_MISSING",
          "필수 정보를 확인한 뒤 신고서 초안을 저장해 주세요.",
        );
      }

      throw new PoliceReportServiceError(
        "EXPORT_NOT_CONFIGURED",
        "신고서 저장·공유 방식은 아직 준비 중입니다.",
      );
    },
  };
}
