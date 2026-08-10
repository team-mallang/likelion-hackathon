import type { DocumentsOverview } from "@/features/documents/types/documents";

export type DocumentsService = {
  getOverview: (caseId: string) => Promise<DocumentsOverview>;
};

export type DocumentsServiceErrorCode =
  | "INVALID_CASE_ID"
  | "FETCH_FAILED";

export class DocumentsServiceError extends Error {
  constructor(
    public readonly code: DocumentsServiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DocumentsServiceError";
  }
}
