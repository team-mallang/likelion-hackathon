import type { DirectionsNavigationTarget } from "@/features/directions/types/directions";

/**
 * S12와 S13이 공유할 최소 navigation state 계약.
 * Screen 구현 단계에서 활성 사건 범위의 in-memory store로 제공한다.
 */
export type DirectionsNavigationState = {
  target: DirectionsNavigationTarget | null;
  setTarget: (target: DirectionsNavigationTarget) => void;
  clearTarget: () => void;
};

let target: DirectionsNavigationTarget | null = null;

export const directionsNavigationState: DirectionsNavigationState = {
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
