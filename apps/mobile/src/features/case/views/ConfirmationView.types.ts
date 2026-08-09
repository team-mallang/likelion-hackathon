import type { CaseDraftItem } from "@/features/case/types/caseDraft";

export type ConfirmationViewProps = {
  caseType: "LOST" | "STOLEN" | "UNKNOWN";
  caseTypeLabel: string;
  items: CaseDraftItem[];
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
    changes: Partial<CaseDraftItem>,
  ) => void;
  onItemRemove: (id: string) => void;
  onLocationChange: (value: string) => void;
  onOccurredAtChange: (value: string) => void;
};
