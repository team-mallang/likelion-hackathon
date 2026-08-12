import type {
  DirectionsTravelMode,
  RouteStatus,
} from "@/features/directions/types/directions";

export type TravelModeDisplay = {
  label: string;
  accessibilityLabel: string;
  iconName: "walk" | "transit" | "drive";
};

export type RouteCtaDisplay = {
  label: string;
  accessibilityLabel: string;
  accessibilityHint: string;
};

const travelModeDisplay: Record<DirectionsTravelMode, TravelModeDisplay> = {
  WALK: {
    label: "도보",
    accessibilityLabel: "도보 경로",
    iconName: "walk",
  },
  TRANSIT: {
    label: "대중교통",
    accessibilityLabel: "대중교통 경로",
    iconName: "transit",
  },
  DRIVE: {
    label: "차량",
    accessibilityLabel: "차량 경로",
    iconName: "drive",
  },
};

const routeCtaDisplay: Record<RouteStatus, RouteCtaDisplay> = {
  READY: {
    label: "경로 안내 시작",
    accessibilityLabel: "경로 안내 시작",
    accessibilityHint: "현재 위치를 사용해 경로 안내를 시작합니다.",
  },
  NAVIGATING: {
    label: "도착했어요",
    accessibilityLabel: "목적지에 도착했어요",
    accessibilityHint: "경로 안내를 종료하고 경찰 지원 화면으로 이동합니다.",
  },
  ARRIVED: {
    label: "경찰 지원 시작",
    accessibilityLabel: "경찰 지원 시작",
    accessibilityHint: "경찰서 실시간 대응 화면으로 이동합니다.",
  },
  FAILED: {
    label: "경로 다시 확인",
    accessibilityLabel: "경로 다시 확인",
    accessibilityHint: "경로를 다시 조회합니다.",
  },
};

export function getTravelModeDisplay(
  mode: DirectionsTravelMode,
): TravelModeDisplay {
  return travelModeDisplay[mode];
}

export function getRouteCtaDisplay(status: RouteStatus): RouteCtaDisplay {
  return routeCtaDisplay[status];
}

export function formatRouteDistance(distanceMeters: number | undefined) {
  if (
    distanceMeters === undefined ||
    !Number.isFinite(distanceMeters) ||
    distanceMeters < 0
  ) {
    return "거리 확인 불가";
  }

  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

export function formatRouteDuration(durationMinutes: number | undefined) {
  if (
    durationMinutes === undefined ||
    !Number.isFinite(durationMinutes) ||
    durationMinutes < 0
  ) {
    return "시간 확인 불가";
  }

  return `${Math.round(durationMinutes)}분`;
}

/**
 * Provider가 선택 수단을 지원하지 않으면 도보를 우선하고, 도보도 없을 때만
 * provider가 제공한 첫 수단을 선택한다. 빈 배열에서는 경로 시작을 막을 수 있게 null을 반환한다.
 */
export function resolveTravelMode(
  availableModes: DirectionsTravelMode[],
  selectedMode: DirectionsTravelMode | null,
): DirectionsTravelMode | null {
  if (selectedMode && availableModes.includes(selectedMode)) {
    return selectedMode;
  }

  if (availableModes.includes("WALK")) {
    return "WALK";
  }

  return availableModes[0] ?? null;
}
