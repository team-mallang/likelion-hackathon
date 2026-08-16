import type {
  CapturedReportPhoto,
  ReportPhotoEntryPoint,
  ReportPhotoStatus,
} from "@/features/report-photo/types/reportPhoto";
import type { DocumentsExportRequest } from "@/features/documents/views/DocumentsView.types";

export type ReportPhotoViewProps = {
  entryPoint: ReportPhotoEntryPoint;
  captureStatus: ReportPhotoStatus;
  isCameraSupported: boolean;
  isFileSelectionSupported: boolean;
  photo: CapturedReportPhoto | null;
  errorMessage: string | null;
  onBack: () => void;
  onCapture: () => void;
  onSelectFile: () => void;
  onRetry: () => void;
  onExport: () => void;
  onExportDocuments: (request: DocumentsExportRequest) => void;
  onReview: () => void;
  onDiscard: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
