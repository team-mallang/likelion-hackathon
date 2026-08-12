export type ScanStatus =
  | "READY"
  | "REQUESTING_PERMISSION"
  | "CAPTURING"
  | "ANALYZING"
  | "SUCCESS"
  | "FAILED";

export type ScanJobStatus = "QUEUED" | "PROCESSING" | "SUCCEEDED" | "FAILED";

export type ScanSource = "SCANNED_DOCUMENT";

export type DocumentScanField = {
  fieldId: string;
  value: string | null;
  confidence?: number;
  required: boolean;
};

/** No image URI, OCR text, address, or phone number is included in route state. */
export type DocumentScanResult = {
  scanJobId: string;
  status: "SUCCEEDED";
  source: ScanSource;
  fields: DocumentScanField[];
  missingFieldIds: string[];
  expiresAt: string;
};

export type StartDocumentScanInput = {
  caseId: string;
  accessToken?: string;
};

export type DocumentScanJob = {
  scanJobId: string;
  status: Exclude<ScanJobStatus, "SUCCEEDED">;
  expiresAt: string;
};

export type DocumentScanNavigationTarget = {
  scanJobId: string;
};
