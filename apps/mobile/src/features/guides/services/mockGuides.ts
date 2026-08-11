import {
  CaseGuidesServiceError,
  type CaseGuidesService,
} from "./guides";
import type {
  CaseGuide,
  CaseGuidesOverview,
} from "@/features/guides/types/guides";

export type MockGuidesOptions = {
  caseNumber?: string;
  delayMs?: number;
  empty?: boolean;
  failCompletion?: boolean;
  failLoad?: boolean;
};

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

function createGuides(): CaseGuide[] {
  return [
    {
      guideId: "block-payment-cards",
      priority: 100,
      urgency: "URGENT",
      title: "결제카드 즉시 정지",
      description: "카드사 앱이나 고객센터를 통해 분실·도난 카드를 즉시 정지하세요.",
      reason: "무단 결제와 추가 금전 피해를 막기 위한 우선 조치입니다.",
      preparations: ["카드사명", "카드사 앱 또는 고객센터 연락 수단"],
      institutionName: "카드사",
      contact: null,
      estimatedMinutes: 5,
      actionType: "CALL",
      actionLabel: "카드사 연락처 확인",
      completionStatus: "PENDING",
      completedAt: null,
    },
    {
      guideId: "report-to-police",
      priority: 90,
      urgency: "IMPORTANT",
      title: "현지 경찰에 사건 신고",
      description: "사건 시간·장소·물품 특징을 정리해 현지 경찰에 신고하세요.",
      reason: "도난 사실을 공식적으로 기록하고 증빙을 확보하기 위한 단계입니다.",
      preparations: ["사건 발생 시간과 장소", "물품 목록과 특징"],
      institutionName: "현지 경찰",
      contact: null,
      estimatedMinutes: 10,
      actionType: "POLICE_SUPPORT",
      actionLabel: "경찰 지원 시작",
      completionStatus: "PENDING",
      completedAt: null,
    },
    {
      guideId: "preserve-incident-records",
      priority: 50,
      urgency: "NORMAL",
      title: "사건 정보와 처리 기록 보관",
      description: "사건 정보와 기관 접수 기록을 한곳에 정리해 보관하세요.",
      reason: "이후 경찰·기관·보험 절차에서 같은 정보가 필요할 수 있습니다.",
      preparations: ["사건 정보", "물품 목록", "기관 접수정보"],
      institutionName: null,
      contact: null,
      estimatedMinutes: null,
      actionType: "NONE",
      actionLabel: null,
      completionStatus: "PENDING",
      completedAt: null,
    },
  ];
}

export function createMockGuidesService(
  options: MockGuidesOptions = {},
): CaseGuidesService {
  const guidesByCaseId = new Map<string, CaseGuide[]>();
  const delayMs = options.delayMs ?? 250;

  function getGuides(caseId: string) {
    const existing = guidesByCaseId.get(caseId);

    if (existing) {
      return existing;
    }

    const created = createGuides();
    guidesByCaseId.set(caseId, created);
    return created;
  }

  return {
    async getOverview({ caseId }) {
      await wait(delayMs);

      if (options.failLoad) {
        throw new CaseGuidesServiceError(
          "NETWORK_ERROR",
          "행동 가이드를 불러오지 못했습니다. 다시 시도해 주세요.",
        );
      }

      return {
        caseId,
        caseNumber: options.caseNumber ?? "KR2026AB12",
        reportStatusLabel: "신고 완료",
        progressPercent: 20,
        heading: "지금은 이것부터 해주세요",
        recommendationReason:
          "확정된 사건 정보와 피해 물품을 기준으로 우선 행동을 정리했어요.",
        guides: options.empty ? [] : getGuides(caseId).map((guide) => ({ ...guide })),
      } satisfies CaseGuidesOverview;
    },
    async updateCompletion({ caseId, guideId, completionStatus }) {
      await wait(delayMs);

      if (options.failCompletion) {
        throw new CaseGuidesServiceError(
          "NETWORK_ERROR",
          "완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.",
        );
      }

      const guides = getGuides(caseId);
      const guide = guides.find((item) => item.guideId === guideId);

      if (!guide) {
        throw new CaseGuidesServiceError(
          "GUIDE_NOT_FOUND",
          "행동 가이드를 찾을 수 없습니다.",
        );
      }

      guide.completionStatus = completionStatus;
      guide.completedAt =
        completionStatus === "COMPLETED" ? new Date().toISOString() : null;
    },
  };
}
