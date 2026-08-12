export type ReportPhotoEntryPoint = "S09_REPORT_DRAFT" | "S07_DOCUMENTS";

export type ReportPhotoStatus =
  | "READY"
  | "REQUESTING_PERMISSION"
  | "CAPTURING"
  | "SELECTING"
  | "PREVIEW"
  | "EXPORTING"
  | "COMPLETED"
  | "FAILED";

export type ReportPhotoSession = {
  entryPoint: ReportPhotoEntryPoint;
  status: ReportPhotoStatus;
  previewAvailable: boolean;
  mimeType?: string;
};

/** URI exists only for the active screen session; never put it in route state. */
export type CapturedReportPhoto = {
  uri: string;
  mimeType?: string;
  fileSize?: number;
};

export type ReportPhotoNavigationTarget = {
  entryPoint: ReportPhotoEntryPoint;
};
