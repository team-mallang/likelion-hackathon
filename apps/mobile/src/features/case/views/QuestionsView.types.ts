import type { CaseAnalysisAnswer, CaseAnalysisQuestion } from "@project/shared";

export type QuestionsViewProps = {
  questions: CaseAnalysisQuestion[];
  answers: Record<string, CaseAnalysisAnswer["value"]>;
  progress: number;
  isSaving: boolean;
  errorMessage: string | null;
  onAnswerChange: (field: string, value: CaseAnalysisAnswer["value"]) => void;
  onBack: () => void;
  onSubmit: () => void;
};
