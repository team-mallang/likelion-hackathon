import {
  PoliceSupportServiceError,
  type PoliceSupportService,
} from "@/features/police-support/services/policeSupport";
import type {
  InterpreterSessionCredentials,
  PoliceSupportOverview,
} from "@/features/police-support/types/policeSupport";

export type MockPoliceSupportOptions = {
  delayMs?: number;
  failOverviewRequest?: boolean;
  failSessionCreation?: boolean;
  failSessionClose?: boolean;
  hasReportDraft?: boolean;
  staleReportDraft?: boolean;
  longPresentationScript?: boolean;
  emptySuggestions?: boolean;
};

const DEFAULT_DELAY_MS = 300;

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, delayMs));
  });
}

function assertCaseId(caseId: string) {
  if (!caseId.trim()) {
    throw new PoliceSupportServiceError(
      "INVALID_CASE_ID",
      "경찰 지원을 시작할 활성 사건이 없습니다.",
    );
  }
}

function createOverview(
  caseId: string,
  options: MockPoliceSupportOptions,
): PoliceSupportOverview {
  const presentationScript = options.longPresentationScript
    ? {
        ja: "本日午後7時頃、渋谷駅付近の混雑した場所で黒い革財布を盗まれました。財布には現金、クレジットカード、身分証明書が入っていました。遺失物の確認と保険請求に必要な被害届を提出したいです。",
        ko: "오늘 오후 7시경 시부야역 근처의 혼잡한 장소에서 검은색 가죽 지갑을 도난당했습니다. 지갑에는 현금, 신용카드와 신분증이 들어 있었습니다. 분실물 확인과 보험 청구에 필요한 피해 신고서를 제출하고 싶습니다.",
      }
    : {
        ja: "午後7時頃、渋谷で財布を盗まれました。遺失物と保険請求のために被害届を出したいです。",
        ko: "오후 7시경 시부야에서 지갑을 도난당했습니다. 분실물 확인과 보험 청구를 위해 피해 신고서를 제출하고 싶습니다.",
      };

  return {
    caseId,
    sourceRevision: "case-revision-2",
    presentationScript,
    suggestions: options.emptySuggestions
      ? []
      : [
          {
            id: "show-lost-items",
            message: "분실물 목록을 경찰관에게 보여주세요.",
            actionType: "SHOW_ITEMS",
          },
          {
            id: "open-police-report",
            message: "신고서 작성이 필요하면 일본어 초안을 확인하세요.",
            actionType: "OPEN_REPORT",
          },
        ],
    reportDraft: options.hasReportDraft
      ? {
          draftId: `mock-report-${caseId}`,
          version: 1,
          sourceRevision: options.staleReportDraft
            ? "case-revision-1"
            : "case-revision-2",
          status: options.staleReportDraft ? "STALE" : "READY",
        }
      : null,
  };
}

function createCredentials(caseId: string): InterpreterSessionCredentials {
  const nonce = Math.random().toString(36).slice(2, 10);
  const expiresAt = new Date(Date.now() + 30 * 60 * 1_000).toISOString();

  return {
    sessionId: `mock-session-${nonce}`,
    appId: "mock-agora-app-id",
    channelName: `mock-police-support-${nonce}`,
    uid: 1001,
    rtcToken: "mock-rtc-token-not-for-network-use",
    rtmToken: "mock-rtm-token-not-for-network-use",
    rtmUserId: `mock-rtm-${nonce}`,
    agentId: `mock-agent-${nonce}`,
    agentRtcUid: "1000",
    expiresAt,
    transcriptionTaskId: `mock-transcription-${nonce}`,
    sourceLanguages: ["ko-KR", "ja-JP"],
    targetLanguages: ["ko-KR", "ja-JP"],
  };
}

export function createMockPoliceSupportService(
  options: MockPoliceSupportOptions = {},
): PoliceSupportService {
  const openSessionIds = new Set<string>();

  return {
    async getOverview({ caseId }) {
      await wait(options.delayMs ?? DEFAULT_DELAY_MS);
      assertCaseId(caseId);

      if (options.failOverviewRequest) {
        throw new PoliceSupportServiceError(
          "SCRIPT_GENERATION_FAILED",
          "경찰관에게 보여줄 사건 설명을 준비하지 못했습니다.",
        );
      }

      return createOverview(caseId, options);
    },

    async createInterpreterSession({ caseId }) {
      await wait(options.delayMs ?? DEFAULT_DELAY_MS);
      assertCaseId(caseId);

      if (options.failSessionCreation) {
        throw new PoliceSupportServiceError(
          "SESSION_CREATION_FAILED",
          "실시간 통역 세션을 시작하지 못했습니다.",
        );
      }

      const credentials = createCredentials(caseId);
      openSessionIds.add(credentials.sessionId);
      return credentials;
    },

    async closeInterpreterSession({ sessionId }) {
      await wait(options.delayMs ?? DEFAULT_DELAY_MS);

      if (!openSessionIds.has(sessionId)) {
        throw new PoliceSupportServiceError(
          "SESSION_NOT_FOUND",
          "종료할 통역 세션을 찾을 수 없습니다.",
        );
      }

      if (options.failSessionClose) {
        throw new PoliceSupportServiceError(
          "SESSION_CLOSE_FAILED",
          "통역 세션을 정상적으로 종료하지 못했습니다.",
        );
      }

      openSessionIds.delete(sessionId);
    },
  };
}
