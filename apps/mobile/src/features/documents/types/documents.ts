export type DocumentStatus = "READY" | "GENERATING" | "FAILED";

export type GeneratedDocument = {
  id: string;
  kind: "CASE_CARD" | "POLICE_REPORT_DRAFT";
  title: string;
  description: string;
  status: DocumentStatus;
};

export type EvidenceFile = {
  id: string;
  kind: "POLICE_REPORT_PHOTO";
  title: string;
  description: string;
  registeredAt: string;
  deliveryDescription: string | null;
  localUri: string | null;
};

export type DocumentsOverview = {
  caseId: string;
  caseNumber: string;
  reportStatusLabel: string;
  progressPercent: number;
  documents: GeneratedDocument[];
  evidenceFiles: EvidenceFile[];
};
