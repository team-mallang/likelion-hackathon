import type {
  AgencyType,
  NearbyAgency,
  OperatingStatus,
  TravelMode,
} from "@/features/nearby-agencies/types/nearbyAgencies";

export function getAgencyTypeLabel(type: AgencyType) {
  switch (type) {
    case "POLICE_STATION":
      return "경찰서";
    case "POLICE_BOX":
      return "파출소";
    case "LOST_AND_FOUND":
      return "분실물 보관 기관";
    case "EMBASSY":
      return "대사관";
  }
}

export function getOperatingStatusLabel(status: OperatingStatus) {
  switch (status) {
    case "OPEN":
      return "운영 중";
    case "CLOSED":
      return "운영 종료";
    case "UNKNOWN":
      return "운영 시간 확인 필요";
  }
}

export function getTravelModeLabel(mode: TravelMode | undefined) {
  switch (mode) {
    case "WALK":
      return "도보";
    case "DRIVE":
      return "차로";
    case "TRANSIT":
      return "대중교통";
    default:
      return "이동 시간 확인 불가";
  }
}

export function formatDistance(distanceMeters: number | undefined) {
  if (distanceMeters === undefined || !Number.isFinite(distanceMeters)) {
    return "거리 확인 불가";
  }

  if (distanceMeters < 1000) {
    return `${Math.max(0, Math.round(distanceMeters))}m`;
  }

  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

export function formatTravelTime(minutes: number | undefined) {
  if (minutes === undefined || !Number.isFinite(minutes)) {
    return null;
  }

  return `${Math.max(0, Math.round(minutes))}분`;
}

export function sortNearbyAgencies(agencies: NearbyAgency[]) {
  return agencies
    .map((agency, index) => ({ agency, index }))
    .sort((left, right) => {
      const leftDistance = left.agency.distanceMeters ?? Number.POSITIVE_INFINITY;
      const rightDistance =
        right.agency.distanceMeters ?? Number.POSITIVE_INFINITY;

      return leftDistance - rightDistance || left.index - right.index;
    })
    .map(({ agency }) => agency);
}

export function resolveSelectedAgencyId(
  agencies: NearbyAgency[],
  currentAgencyId: string | null,
) {
  return (
    agencies.find((agency) => agency.agencyId === currentAgencyId)?.agencyId ??
    agencies.find((agency) => agency.isNearest)?.agencyId ??
    agencies[0]?.agencyId ??
    null
  );
}
