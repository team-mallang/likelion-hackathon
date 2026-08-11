import type { CaseAnalysisAnswer, CaseAnalysisQuestion } from "@project/shared";

export type QuestionsViewProps = {
  currentQuestion: CaseAnalysisQuestion | null;
  currentAnswer: CaseAnalysisAnswer["value"];
  currentIndex: number;
  totalCount: number;
  progress: number;
  isSaving: boolean;
  errorMessage: string | null;
  onAnswerChange: (value: CaseAnalysisAnswer["value"]) => void;
  onBack: () => void;
  onSubmit: () => void;
};
