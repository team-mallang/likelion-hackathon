export type DocumentsReturnTarget = "POLICE_SUPPORT";

let returnTarget: DocumentsReturnTarget | null = null;

/** Keeps the intended parent screen when replace-based flows open S07. */
export const documentsNavigationState = {
  get returnTarget() {
    return returnTarget;
  },
  setReturnTarget(target: DocumentsReturnTarget) {
    returnTarget = target;
  },
  consumeReturnTarget() {
    const target = returnTarget;
    returnTarget = null;
    return target;
  },
  clearReturnTarget() {
    returnTarget = null;
  },
};
