import type { DocumentScanNavigationTarget } from "@/features/document-scan/types/documentScan";

export type DocumentScanNavigationState = {
  target: DocumentScanNavigationTarget | null;
  setTarget: (target: DocumentScanNavigationTarget) => void;
  clearTarget: () => void;
};

let target: DocumentScanNavigationTarget | null = null;

/** Keeps only an opaque, short-lived scan job ID between S10 and S09. */
export const documentScanNavigationState: DocumentScanNavigationState = {
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
