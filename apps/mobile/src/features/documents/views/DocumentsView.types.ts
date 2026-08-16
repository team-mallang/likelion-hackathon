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
};

export type EvidenceActionError = {
  evidenceId: string;
  message: string;
};

export type DocumentsExportRequest =
  | { method: "EMAIL"; email: string }
  | { method: "GALLERY" };

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
  onHome: () => void;
  onBack: () => void;
  onRetry: () => void;
  onCopyCaseNumber: () => void;
  onOpenCaseGuide: () => void;
  onOpenDocument: (documentId: string) => void;
  onOpenEvidence: (evidenceId: string) => void;
  onShareEvidence: (evidenceId: string) => void;
  onCaptureEvidence: () => void;
  onExportDocuments: (request: DocumentsExportRequest) => void;
  onOpenInsuranceProducts: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
