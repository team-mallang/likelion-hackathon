import type {
  PoliceReportDraft,
  PoliceReportLanguage,
} from "@/features/police-report/types/policeReport";

export type PoliceReportViewProps = {
  draft: PoliceReportDraft | null;
  displayLanguage: PoliceReportLanguage;
  isLoading: boolean;
  isSwitchingLanguage: boolean;
  isRegenerating: boolean;
  isExporting: boolean;
  errorMessage: string | null;
  translationErrorMessage: string | null;
  regenerationErrorMessage: string | null;
  exportErrorMessage: string | null;
  canExport: boolean;
  hasUnsavedChanges: boolean;
  onBack: () => void;
  onRetry: () => void;
  onToggleLanguage: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
  onSaveOrShare: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
