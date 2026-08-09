import type {
  CaseDraft,
  CaseDraftItem,
  CaseDraftQuestion,
} from "@/features/case/types/caseDraft";

export type TranscribeAudioInput = {
  uri: string;
  mimeType?: string;
  durationMs?: number;
};

export type TranscribeAudioResult = {
  statement: string;
};

export type AnalyzeStatementInput = {
  statement: string;
  locationText: string;
  occurredAtText: string;
};

export type AnalyzeStatementResult = {
  summary: string;
  caseType: CaseDraft["caseType"];
  questions: CaseDraftQuestion[];
};

export type BuildCaseSummaryInput = {
  draft: CaseDraft;
};

export type CaseSummaryResult = {
  caseType: CaseDraft["caseType"];
  items: CaseDraftItem[];
  emergencyItemIncluded: boolean;
  riskLevel: CaseDraft["riskLevel"];
  details: string;
  clues: string;
};

export type SaveDraftResult = {
  caseId: string;
  caseNumber: string;
  savedAt: string;
};

export type SetCasePasswordInput = {
  caseId: string;
  password: string;
};

export type SetCasePasswordResult = {
  confirmedAt: string;
};

export type CaseFlow = {
  transcribeAudio: (
    input: TranscribeAudioInput,
  ) => Promise<TranscribeAudioResult>;
  analyzeStatement: (
    input: AnalyzeStatementInput,
  ) => Promise<AnalyzeStatementResult>;
  buildCaseSummary: (
    input: BuildCaseSummaryInput,
  ) => Promise<CaseSummaryResult>;
  saveDraft: (draft: CaseDraft) => Promise<SaveDraftResult>;
  setCasePassword: (
    input: SetCasePasswordInput,
  ) => Promise<SetCasePasswordResult>;
};

export type CaseFlowErrorCode =
  | "INVALID_INPUT"
  | "TRANSCRIPTION_FAILED"
  | "ANALYSIS_FAILED"
  | "SUMMARY_FAILED"
  | "SAVE_FAILED"
  | "PASSWORD_SETUP_FAILED";

export class CaseFlowError extends Error {
  constructor(
    public readonly code: CaseFlowErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "CaseFlowError";
  }
}
