import type { CapturedReportPhoto } from "@/features/report-photo/types/reportPhoto";

export type ReportPhotoCaptureErrorCode =
  | "PERMISSION_DENIED"
  | "CAMERA_NOT_SUPPORTED"
  | "FILE_SELECTION_NOT_SUPPORTED"
  | "INVALID_FILE_TYPE"
  | "FILE_TOO_LARGE"
  | "CAPTURE_CANCELLED"
  | "CAPTURE_FAILED";

export class ReportPhotoCaptureError extends Error {
  constructor(
    public readonly code: ReportPhotoCaptureErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReportPhotoCaptureError";
  }
}

export type ReportPhotoCaptureService = {
  isCameraSupported: boolean;
  isFileSelectionSupported: boolean;
  capture(): Promise<CapturedReportPhoto>;
  selectFile(): Promise<CapturedReportPhoto>;
};
