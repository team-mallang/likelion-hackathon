import type { CapturedReportPhoto } from "@/features/report-photo/types/reportPhoto";

export type ReportPhotoExportResult = "COMPLETED" | "CANCELLED";

export type ReportPhotoExportErrorCode =
  | "EXPORT_NOT_SUPPORTED"
  | "EXPORT_CANCELLED"
  | "EXPORT_FAILED";

export class ReportPhotoExportError extends Error {
  constructor(
    public readonly code: ReportPhotoExportErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ReportPhotoExportError";
  }
}

export type ReportPhotoExportService = {
  saveOrShare(photo: CapturedReportPhoto): Promise<ReportPhotoExportResult>;
};
