import type {
  ReportDocumentField,
  ReportDocumentFieldKey,
  ReportDocumentReviewStatus,
} from "@/features/report-document-review/types/reportDocumentReview";

export type ReportDocumentReviewViewProps = {
  photoUri: string | null;
  reviewStatus: ReportDocumentReviewStatus;
  fields: ReportDocumentField[];
  editingField: ReportDocumentFieldKey | null;
  errorMessage: string | null;
  fieldError: string | null;
  onBack: () => void;
  onEditField: (key: ReportDocumentFieldKey) => void;
  onChangeField: (key: ReportDocumentFieldKey, value: string) => void;
  onSaveField: (key: ReportDocumentFieldKey) => void;
  onCancelField: () => void;
  onMoveToDocuments: () => void;
  onRetake: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
