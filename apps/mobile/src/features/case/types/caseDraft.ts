import type {
  CaseAnalysisAnswer,
  CaseAnalysisQuestion,
  CaseInputItem,
  CaseType,
} from "@project/shared";

export type CaseDraftCoordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
};

export type CaseDraft = {
  initialStatement: string;
  countryCode: string;
  type: CaseType;

  lastSeenAt: string | null;
  lastSeenPlace: string | null;
  discoveredAt: string | null;
  discoveredPlace: string | null;
  estimatedOccurredAt: string | null;
  estimatedOccurredPlace: string | null;
  routeAfterLastSeen: string | null;
  storageState: string | null;

  description: string | null;
  aiSummary: string | null;
  missingFields: string[];
  items: CaseInputItem[];

  questions: CaseAnalysisQuestion[];
  answers: CaseAnalysisAnswer[];

  inputMode: "voice" | "text";
  coordinates: CaseDraftCoordinates | null;
  emergencyItemIncluded: boolean;
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
  estimatedOccurredAt: null,
  estimatedOccurredPlace: null,
  routeAfterLastSeen: null,
  storageState: null,
  description: null,
  aiSummary: null,
  missingFields: [],
  items: [],
  questions: [],
  answers: [],
  inputMode: "voice",
  coordinates: null,
  emergencyItemIncluded: false,
  errorMessage: null,
};
