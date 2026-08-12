import type { CaseInputItem } from "@project/shared";

type ConfirmationViewItem = CaseInputItem & { id: string };

export type ConfirmationViewProps = {
  caseType: "LOST" | "STOLEN" | "UNKNOWN";
  caseTypeLabel: string;
  items: ConfirmationViewItem[];
  occurredAtText: string;
  locationText: string;
  emergencyItemIncluded: boolean;
  riskLevelLabel: string;
  details: string;
  clues: string;
  isEditing: boolean;
  isSaving: boolean;
  isSaved: boolean;
  canConfirm: boolean;
  errorMessage: string | null;
  onBack: () => void;
  onCaseTypeChange: (
    value: "LOST" | "STOLEN" | "UNKNOWN",
  ) => void;
  onCluesChange: (value: string) => void;
  onConfirm: () => void;
  onDetailsChange: (value: string) => void;
  onEditToggle: () => void;
  onItemAdd: () => void;
  onItemChange: (
    id: string,
    changes: Partial<ConfirmationViewItem>,
  ) => void;
  onItemRemove: (id: string) => void;
  onLocationChange: (value: string) => void;
  onOccurredAtChange: (value: string) => void;
  additionalCaseFields?: Array<{ label: string; value: string; onChange: (value: string) => void }>;
};
