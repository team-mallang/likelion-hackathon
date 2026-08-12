export type ReportDocumentFieldKey =
  | "incidentNumber"
  | "occurredAt"
  | "policeStation";

export type ReportDocumentFieldConfidence = "HIGH" | "MEDIUM" | "LOW";

export type ReportDocumentReviewStatus =
  | "LOADING"
  | "REVIEW_REQUIRED"
  | "READY_FOR_DOCUMENTS"
  | "FAILED";

export type ReportDocumentField = {
  key: ReportDocumentFieldKey;
  label: string;
  value: string;
  confidence?: ReportDocumentFieldConfidence;
  editable: boolean;
  required: boolean;
};

export type ReportDocumentReviewSource = "S15_REPORT_PHOTO";

export type ReportDocumentReviewSession = {
  sessionId: string;
  source: ReportDocumentReviewSource;
  status: ReportDocumentReviewStatus;
  fields: ReportDocumentField[];
  photoAvailable: boolean;
};

export type ReportDocumentReviewPhoto = {
  uri: string;
  mimeType?: string;
};

/** Deliberately omits photo URI: only the short-lived service session owns it. */
export type ReportDocumentReviewNavigationTarget = {
  sessionId: string;
  source: ReportDocumentReviewSource;
};
