import type {
  LocalizedText,
  PoliceReportDraftStatus,
} from "@/features/police-report/types/policeReport";

export type SpeakerRole = "TRAVELER" | "POLICE_OFFICER";

export type SupportedLanguage = "ko-KR" | "ja-JP";

export type InterpreterTurnStatus =
  | "PARTIAL"
  | "FINAL"
  | "TRANSCRIPTION_FAILED"
  | "TRANSLATION_FAILED";

export type InterpreterTurn = {
  id: string;
  sessionId: string;
  turnId: string;
  sentenceId: string | null;
  speakerRole: SpeakerRole;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  originalText: string;
  translatedText: string | null;
  sequence: number;
  status: InterpreterTurnStatus;
  errorMessage: string | null;
};

export type PoliceSupportSuggestionActionType =
  | "SHOW_ITEMS"
  | "OPEN_REPORT"
  | "OPEN_CASE"
  | "NONE";

export type PoliceSupportSuggestion = {
  id: string;
  message: string;
  actionType: PoliceSupportSuggestionActionType;
};

export type PoliceReportDraftSummary = {
  draftId: string;
  version: number;
  sourceRevision: string;
  status: PoliceReportDraftStatus;
};

export type PoliceSupportOverview = {
  caseId: string;
  sourceRevision: string;
  presentationScript: LocalizedText;
  suggestions: PoliceSupportSuggestion[];
  reportDraft: PoliceReportDraftSummary | null;
};

export type InterpreterSessionCredentials = {
  sessionId: string;
  appId: string;
  channelName: string;
  uid: number;
  rtcToken: string;
  rtmToken: string;
  rtmUserId: string;
  agentId: string;
  agentRtcUid: string;
  expiresAt: string;
  transcriptionTaskId: string;
  sourceLanguages: SupportedLanguage[];
  targetLanguages: SupportedLanguage[];
};
