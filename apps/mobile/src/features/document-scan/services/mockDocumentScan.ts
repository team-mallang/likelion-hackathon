import {
  DocumentScanServiceError,
  type DocumentScanService,
} from "./documentScan";

export type MockDocumentScanOptions = {
  delayMs?: number;
  failStart?: boolean;
  failResult?: boolean;
};

function wait(delayMs: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, delayMs));
}

/** Temporary typed boundary until camera upload and OCR backend are available. */
export function createMockDocumentScanService(
  options: MockDocumentScanOptions = {},
): DocumentScanService {
  return {
    async start({ caseId }) {
      await wait(options.delayMs ?? 120);
      if (!caseId.trim()) {
        throw new DocumentScanServiceError("INVALID_CASE_ID", "활성 사건이 없습니다.");
      }
      if (options.failStart) {
        throw new DocumentScanServiceError("ANALYSIS_NOT_CONFIGURED", "문서 분석 기능을 준비하고 있습니다.");
      }
      return {
        scanJobId: `mock-scan-${caseId}`,
        status: "QUEUED",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };
    },
    async getResult({ caseId, scanJobId }) {
      await wait(options.delayMs ?? 120);
      if (!caseId.trim() || !scanJobId.trim()) {
        throw new DocumentScanServiceError("INVALID_CASE_ID", "스캔 작업을 확인할 수 없습니다.");
      }
      if (options.failResult) {
        throw new DocumentScanServiceError("ANALYSIS_NOT_CONFIGURED", "문서 분석 기능을 준비하고 있습니다.");
      }
      return {
        scanJobId,
        status: "SUCCEEDED",
        source: "SCANNED_DOCUMENT",
        fields: [],
        missingFieldIds: [],
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      };
    },
  };
}
