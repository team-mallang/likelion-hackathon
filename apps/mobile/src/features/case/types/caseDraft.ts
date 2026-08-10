import type {
  CaseAnalysisAnswer,
  CaseAnalysisQuestion,
  CaseInputItem,
  CaseType,
} from "@project/shared";

export type CaseDraft = {
  initialStatement: string;
  countryCode: string;
  type: CaseType;

  lastSeenAt: string | null;
  lastSeenPlace: string | null;
  discoveredAt: string | null;
  discoveredPlace: string | null;

  description: string | null;
  aiSummary: string | null;
  missingFields: string[];
  items: CaseInputItem[];

  questions: CaseAnalysisQuestion[];
  answers: CaseAnalysisAnswer[];

  inputMode: "voice" | "text";
  emergencyItemIncluded: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  errorMessage: string | null;
};

export const initialCaseDraft: CaseDraft = {
  initialStatement: "",
  countryCode: "JP",
  type: "UNKNOWN",
  lastSeenAt: null,
  lastSeenPlace: null,
  discoveredAt: null,
  discoveredPlace: null,
  description: null,
  aiSummary: null,
  missingFields: [],
  items: [],
  questions: [],
  answers: [],
  inputMode: "voice",
  emergencyItemIncluded: false,
  riskLevel: "LOW",
  errorMessage: null,
};
