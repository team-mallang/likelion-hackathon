import type { ReportDocumentReviewNavigationTarget } from "@/features/report-document-review/types/reportDocumentReview";

export type ReportDocumentReviewNavigationState = {
  target: ReportDocumentReviewNavigationTarget | null;
  setTarget: (target: ReportDocumentReviewNavigationTarget) => void;
  clearTarget: () => void;
};

let target: ReportDocumentReviewNavigationTarget | null = null;

/** Only opaque session metadata crosses the route boundary; never a URI or OCR text. */
export const reportDocumentReviewNavigationState: ReportDocumentReviewNavigationState = {
  get target() {
    return target;
  },
  setTarget(nextTarget) {
    target = nextTarget;
  },
  clearTarget() {
    target = null;
  },
};
