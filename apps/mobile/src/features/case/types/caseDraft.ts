export type CaseDraftQuestion = {
  field: string;
  question: string;
  answer: string;
};

export type CaseDraftItem = {
  name: string;
  category?: string;
  description?: string;
};

export type CaseDraftCoordinates = {
  latitude: number;
  longitude: number;
  accuracyMeters: number | null;
  capturedAt: string;
};

export type CaseDraft = {
  statement: string;
  inputMode: "voice" | "text";

  locationText: string;
  coordinates: CaseDraftCoordinates | null;
  occurredAtText: string;

  questions: CaseDraftQuestion[];

  caseType: "LOST" | "STOLEN" | "UNKNOWN";
  items: CaseDraftItem[];

  emergencyItemIncluded: boolean;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";

  details: string;
  clues: string;

  isSaving: boolean;
  errorMessage: string | null;
};

export const initialCaseDraft: CaseDraft = {
  statement: "",
  inputMode: "voice",

  locationText: "",
  coordinates: null,
  occurredAtText: "",

  questions: [],

  caseType: "UNKNOWN",
  items: [],

  emergencyItemIncluded: false,
  riskLevel: "LOW",

  details: "",
  clues: "",

  isSaving: false,
  errorMessage: null,
};
