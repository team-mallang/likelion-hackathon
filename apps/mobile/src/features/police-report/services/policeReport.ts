import type {
  PoliceReportDraft,
  PoliceReportExport,
} from "@/features/police-report/types/policeReport";

export type PoliceReportServiceErrorCode =
  | "INVALID_CASE_ID"
  | "DRAFT_NOT_FOUND"
  | "SOURCE_REVISION_MISMATCH"
  | "REQUIRED_INFORMATION_MISSING"
  | "GENERATION_FAILED"
  | "EXPORT_NOT_CONFIGURED"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class PoliceReportServiceError extends Error {
  constructor(
    public readonly code: PoliceReportServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PoliceReportServiceError";
  }
}

export type PoliceReportCaseInput = {
  caseId: string;
  accessToken?: string;
  /** Opaque S10 job ID only; image URI and OCR text never enter navigation. */
  scanJobId?: string;
};

export type RegeneratePoliceReportInput = PoliceReportCaseInput & {
  draftId: string;
  sourceRevision: string;
};

export type UpdatePoliceReportDraftInput = PoliceReportCaseInput & {
  edits: Array<{ key: string; valueKo: string | null }>;
};

export type CreatePoliceReportExportInput = PoliceReportCaseInput & {
  draftId: string;
  version: number;
};

export type PoliceReportService = {
  getOrCreateDraft(input: PoliceReportCaseInput): Promise<PoliceReportDraft>;
  regenerateDraft(
    input: RegeneratePoliceReportInput,
  ): Promise<PoliceReportDraft>;
  updateDraft(input: UpdatePoliceReportDraftInput): Promise<PoliceReportDraft>;
  createExport(
    input: CreatePoliceReportExportInput,
  ): Promise<PoliceReportExport>;
};
