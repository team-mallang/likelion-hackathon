import type { CaseGuidesOverview } from "@/features/guides/types/guides";

export type CaseGuidesViewProps = {
  overview: CaseGuidesOverview | null;
  isLoading: boolean;
  errorMessage: string | null;
  updatingGuideId: string | null;
  onBack: () => void;
  onRetry: () => void;
  onRunGuideAction: (guideId: string) => void;
  onCompleteGuide: (guideId: string) => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
