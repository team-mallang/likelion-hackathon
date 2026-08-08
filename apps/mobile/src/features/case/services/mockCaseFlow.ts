import { caseDraftFixture } from "@/mocks/caseDraftFixture";

import {
  CaseFlowError,
  type AnalyzeStatementResult,
  type CaseFlow,
  type CaseSummaryResult,
} from "./caseFlow";

export type MockCaseFlowOptions = {
  delayMs?: number;
  failTranscription?: boolean;
  failAnalysis?: boolean;
  failSummary?: boolean;
  failSave?: boolean;
};

const DEFAULT_DELAY_MS = 300;

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, delayMs));
  });
}

function createAnalysisResult(statement: string): AnalyzeStatementResult {
  return {
    summary: statement,
    caseType: caseDraftFixture.caseType,
    questions: caseDraftFixture.questions.map((question) => ({
      ...question,
      answer: "",
    })),
  };
}

function createCaseSummaryResult(
  draft: Parameters<CaseFlow["saveDraft"]>[0],
): CaseSummaryResult {
  return {
    caseType:
      draft.caseType === "UNKNOWN"
        ? caseDraftFixture.caseType
        : draft.caseType,
    items: (draft.items.length > 0
      ? draft.items
      : caseDraftFixture.items
    ).map((item) => ({ ...item })),
    emergencyItemIncluded: draft.emergencyItemIncluded,
    riskLevel:
      draft.riskLevel === "LOW"
        ? caseDraftFixture.riskLevel
        : draft.riskLevel,
    details: draft.details || caseDraftFixture.details,
    clues: draft.clues || caseDraftFixture.clues,
  };
}

export function createMockCaseFlow(
  options: MockCaseFlowOptions = {},
): CaseFlow {
  const delayMs = options.delayMs ?? DEFAULT_DELAY_MS;

  return {
    async transcribeAudio(input) {
      await wait(delayMs);

      if (!input.uri.trim()) {
        throw new CaseFlowError(
          "INVALID_INPUT",
          "처리할 음성 파일이 없습니다.",
        );
      }

      if (options.failTranscription) {
        throw new CaseFlowError(
          "TRANSCRIPTION_FAILED",
          "음성을 문장으로 변환하지 못했습니다.",
        );
      }

      return {
        statement: caseDraftFixture.statement,
      };
    },

    async analyzeStatement(input) {
      await wait(delayMs);

      if (!input.statement.trim()) {
        throw new CaseFlowError(
          "INVALID_INPUT",
          "분석할 사건 설명이 없습니다.",
        );
      }

      if (options.failAnalysis) {
        throw new CaseFlowError(
          "ANALYSIS_FAILED",
          "사건 내용을 분석하지 못했습니다.",
        );
      }

      return createAnalysisResult(input.statement);
    },

    async buildCaseSummary(input) {
      await wait(delayMs);

      if (options.failSummary) {
        throw new CaseFlowError(
          "SUMMARY_FAILED",
          "사건 카드 내용을 만들지 못했습니다.",
        );
      }

      return createCaseSummaryResult(input.draft);
    },

    async saveDraft(draft) {
      await wait(delayMs);

      if (!draft.statement.trim()) {
        throw new CaseFlowError(
          "INVALID_INPUT",
          "저장할 사건 설명이 없습니다.",
        );
      }

      if (options.failSave) {
        throw new CaseFlowError(
          "SAVE_FAILED",
          "사건 내용을 저장하지 못했습니다.",
        );
      }

      return {
        draftId: "mock-draft-001",
        savedAt: new Date().toISOString(),
      };
    },
  };
}

export const mockCaseFlow = createMockCaseFlow();
