import type { ReportPhotoNavigationTarget } from "@/features/report-photo/types/reportPhoto";

export type ReportPhotoNavigationState = {
  target: ReportPhotoNavigationTarget | null;
  setTarget: (target: ReportPhotoNavigationTarget) => void;
  clearTarget: () => void;
};

let target: ReportPhotoNavigationTarget | null = null;

/** Only entry point crosses the route boundary; no image or case details. */
export const reportPhotoNavigationState: ReportPhotoNavigationState = {
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
