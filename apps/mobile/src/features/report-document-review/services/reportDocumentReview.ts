import type {
  ReportDocumentField,
  ReportDocumentFieldKey,
  ReportDocumentReviewPhoto,
  ReportDocumentReviewSession,
  ReportDocumentReviewSource,
  ReportDocumentReviewStatus,
} from "@/features/report-document-review/types/reportDocumentReview";

export type ReportDocumentReviewErrorCode =
  | "SESSION_NOT_FOUND"
  | "PHOTO_NOT_AVAILABLE"
  | "REVIEW_FAILED"
  | "REVIEW_CANCELLED";

export class ReportDocumentReviewError extends Error {
  constructor(
    public readonly code: ReportDocumentReviewErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReportDocumentReviewError";
  }
}

export type CreateReportDocumentReviewInput = {
  source: ReportDocumentReviewSource;
  photo: ReportDocumentReviewPhoto;
};

export type ReportDocumentReviewAnalyzer = {
  analyze(photo: ReportDocumentReviewPhoto): Promise<ReportDocumentField[]>;
};

export type ReportDocumentReviewService = {
  createSession(input: CreateReportDocumentReviewInput): Promise<{ sessionId: string }>;
  getReview(sessionId: string): Promise<ReportDocumentReviewSession>;
  getPhoto(sessionId: string): Promise<ReportDocumentReviewPhoto>;
  updateField(
    sessionId: string,
    key: ReportDocumentFieldKey,
    value: string,
  ): Promise<ReportDocumentReviewSession>;
  clearSession(sessionId: string): void;
};

export type ReportDocumentReviewFailure = {
  status: Extract<ReportDocumentReviewStatus, "FAILED">;
  message: string;
};

export function hasRequiredReviewFields(fields: ReportDocumentField[]) {
  return fields.every((field) => !field.required || field.value.trim().length > 0);
}
