export type PoliceReportLanguage = "ja" | "ko";

export type LocalizedText = {
  ja: string;
  ko: string;
};

export type PoliceReportDraftStatus = "READY" | "STALE" | "FAILED";
export type PoliceReportDraftSource = "CASE_CARD" | "SCANNED_DOCUMENT";

export type PoliceReportField = {
  id: string;
  label: LocalizedText;
  value: LocalizedText;
  required: boolean;
  missing: boolean;
};

export type PoliceReportItemDetail = {
  id: string;
  text: LocalizedText;
};

export type PoliceReportItem = {
  id: string;
  order: number;
  title: LocalizedText;
  details: PoliceReportItemDetail[];
};

export type PoliceReportDraft = {
  draftId: string;
  caseId: string;
  version: number;
  sourceRevision: string;
  status: PoliceReportDraftStatus;
  source: PoliceReportDraftSource;
  applicantFields: PoliceReportField[];
  incidentFields: PoliceReportField[];
  items: PoliceReportItem[];
  narrative: LocalizedText;
  missingFieldIds: string[];
};

type PoliceReportExportBase = {
  exportId: string;
  mimeType: string;
};

export type PoliceReportExport = PoliceReportExportBase &
  (
    | {
        localUri: string;
        downloadUrl?: never;
        expiresAt?: never;
      }
    | {
        localUri?: never;
        downloadUrl: string;
        expiresAt: string;
      }
  );
