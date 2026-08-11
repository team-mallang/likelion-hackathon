export type QuestionsViewProps = {
  currentQuestion: string | null;
  currentAnswer: string;
  currentIndex: number;
  totalCount: number;
  progress: number;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSaving: boolean;
  errorMessage: string | null;
  onAnswerChange: (value: string) => void;
  onBack: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
};
