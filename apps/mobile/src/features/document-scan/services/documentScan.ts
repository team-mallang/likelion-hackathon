import type {
  DocumentScanJob,
  DocumentScanResult,
  StartDocumentScanInput,
} from "@/features/document-scan/types/documentScan";

export type DocumentScanServiceErrorCode =
  | "INVALID_CASE_ID"
  | "CAMERA_NOT_SUPPORTED"
  | "PERMISSION_DENIED"
  | "DOCUMENT_NOT_DETECTED"
  | "IMAGE_QUALITY_TOO_LOW"
  | "ANALYSIS_NOT_CONFIGURED"
  | "ANALYSIS_FAILED"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class DocumentScanServiceError extends Error {
  constructor(
    public readonly code: DocumentScanServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DocumentScanServiceError";
  }
}

/**
 * OCR backend is not connected yet. This interface intentionally receives no
 * image URI; upload/capture ownership will be added only after its retention
 * and encryption contract is approved.
 */
export type DocumentScanService = {
  start(input: StartDocumentScanInput): Promise<DocumentScanJob>;
  getResult(input: {
    caseId: string;
    accessToken?: string;
    scanJobId: string;
  }): Promise<DocumentScanResult>;
};
