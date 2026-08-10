import type {
  EvidenceFile,
  GeneratedDocument,
} from "@/features/documents/types/documents";

export type DocumentsViewProps = {
  caseNumber: string;
  reportStatusLabel: string;
  progressPercent: number;
  documents: GeneratedDocument[];
  evidenceFiles: EvidenceFile[];
  isLoading: boolean;
  errorMessage: string | null;
  copyFeedbackVisible: boolean;
  sharingEvidenceId: string | null;
  onBack: () => void;
  onRetry: () => void;
  onCopyCaseNumber: () => void;
  onOpenCaseGuide: () => void;
  onOpenDocument: (documentId: string) => void;
  onOpenEvidence: (evidenceId: string) => void;
  onShareEvidence: (evidenceId: string) => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
