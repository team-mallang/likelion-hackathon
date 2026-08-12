import type {
  DocumentScanResult,
  ScanStatus,
} from "@/features/document-scan/types/documentScan";

export type DocumentScanViewProps = {
  scanStatus: ScanStatus;
  isCameraSupported: boolean;
  errorMessage: string | null;
  result: DocumentScanResult | null;
  onBack: () => void;
  onStartScan: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onReviewDraft: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
