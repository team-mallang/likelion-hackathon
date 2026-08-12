import type { DocumentScanResult } from "@/features/document-scan/types/documentScan";

export const documentScanSuccessFixture: DocumentScanResult = {
  scanJobId: "mock-scan-case-1",
  status: "SUCCEEDED",
  source: "SCANNED_DOCUMENT",
  fields: [],
  missingFieldIds: [],
  expiresAt: "2026-08-12T01:00:00.000Z",
};
