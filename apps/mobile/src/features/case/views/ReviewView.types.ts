export type ReviewViewProps = {
  statement: string;
  isEditingStatement: boolean;
  isAnalyzing: boolean;
  errorMessage: string | null;
  canAnalyze: boolean;
  onAnalyze: () => void;
  onBack: () => void;
  onRecordAgain: () => void;
  onStatementChange: (value: string) => void;
  onStatementEditToggle: () => void;
};
