import type { PreviousCaseCard } from "@/features/case-card/types/caseCard";

export type PreviousCaseCardViewProps = {
  caseCard: PreviousCaseCard | null;
  isLoading: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onRetry: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
