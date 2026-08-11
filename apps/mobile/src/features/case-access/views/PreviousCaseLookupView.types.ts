export type PreviousCaseLookupViewProps = {
  caseNumber: string;
  password: string;
  isPasswordVisible: boolean;
  caseNumberError: string | null;
  passwordError: string | null;
  submissionError: string | null;
  canSubmit: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onChangeCaseNumber: (value: string) => void;
  onChangePassword: (value: string) => void;
  onTogglePasswordVisibility: () => void;
  onSubmit: () => void;
  onStartNewCase: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
