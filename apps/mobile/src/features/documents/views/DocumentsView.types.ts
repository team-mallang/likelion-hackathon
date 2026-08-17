import type {
  GeneratedDocument,
} from "@/features/documents/types/documents";

export type EvidenceFileViewModel = {
  id: string;
  kind: "POLICE_REPORT_PHOTO";
  title: string;
  description: string;
  registeredAtLabel: string;
  deliveryDescription: string | null;
  localUri: string | null;
  previewUri: string | null;
  previewHeaders?: Record<string, string>;
  canDelete: boolean;
};

export type EvidenceActionError = {
  evidenceId: string;
  message: string;
};

export type DocumentsExportRequest =
  | { method: "EMAIL"; email: string }
  | { method: "DEVICE" };

export type DocumentsViewProps = {
  caseNumber: string;
  reportStatusLabel: string;
  progressPercent: number;
  documents: GeneratedDocument[];
  evidenceFiles: EvidenceFileViewModel[];
  isLoading: boolean;
  errorMessage: string | null;
  copyFeedbackVisible: boolean;
  sharingEvidenceId: string | null;
  evidenceActionError: EvidenceActionError | null;
  isInspectingEvidence: boolean;
  deletingEvidenceId: string | null;
  previewEvidence: EvidenceFileViewModel | null;
  onHome: () => void;
  onBack: () => void;
  onRetry: () => void;
  onCopyCaseNumber: () => void;
  onOpenCaseGuide: () => void;
  onOpenDocument: (documentId: string) => void;
  onOpenEvidence: (evidenceId: string) => void;
  onShareEvidence: (evidenceId: string) => void;
  onDeleteEvidence: (evidenceId: string) => void;
  onCloseEvidencePreview: () => void;
  onCaptureEvidence: () => void;
  onExportDocuments: (request: DocumentsExportRequest) => Promise<void>;
  isExporting: boolean;
  onOpenInsuranceProducts: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
