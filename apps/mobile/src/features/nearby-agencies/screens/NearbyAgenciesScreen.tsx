import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { createMockNearbyAgenciesService } from "@/features/nearby-agencies/services/mockNearbyAgencies";
import { NearbyAgenciesServiceError } from "@/features/nearby-agencies/services/nearbyAgencies";
import type {
  DeviceLocation,
  NearbyAgency,
} from "@/features/nearby-agencies/types/nearbyAgencies";
import { NearbyAgenciesView } from "@/features/nearby-agencies/views/NearbyAgenciesView";

const mockReferenceLocation: DeviceLocation = {
  latitude: 35.6595,
  longitude: 139.7005,
  accuracyMeters: 25,
};

export function NearbyAgenciesScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const nearbyAgenciesService = useMemo(
    () => createMockNearbyAgenciesService(),
    [activeCase?.caseId],
  );
  const [referenceLocation, setReferenceLocation] =
    useState<DeviceLocation | null>(mockReferenceLocation);
  const [agencies, setAgencies] = useState<NearbyAgency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(Boolean(activeCase));
  const [locationErrorMessage, setLocationErrorMessage] = useState<string | null>(
    null,
  );
  const [agenciesErrorMessage, setAgenciesErrorMessage] = useState<string | null>(
    null,
  );
  const [mapStatus, setMapStatus] = useState<"READY" | "UNAVAILABLE" | "LOADING">(
    "READY",
  );
  const requestIdRef = useRef(0);

  const loadAgencies = useCallback(async () => {
    if (!activeCase) {
      setAgencies([]);
      setIsLoadingAgencies(false);
      setAgenciesErrorMessage("사건을 먼저 시작하거나 이전 사건을 조회해 주세요.");
      return;
    }

    if (!referenceLocation) {
      setAgenciesErrorMessage("현재 위치를 확인한 뒤 주변 기관을 찾아 주세요.");
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoadingAgencies(true);
    setAgenciesErrorMessage(null);

    try {
      const result = await nearbyAgenciesService.getNearbyAgencies({
        caseId: activeCase.caseId,
        accessToken: activeCase.accessToken,
        location: referenceLocation,
        sort: "DISTANCE",
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setAgencies(result.agencies);
      setSelectedAgencyId(
        (current) =>
          result.agencies.some((agency) => agency.agencyId === current)
            ? current
            : result.agencies.find((agency) => agency.isNearest)?.agencyId ??
              result.agencies[0]?.agencyId ??
              null,
      );
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setAgenciesErrorMessage(
          error instanceof NearbyAgenciesServiceError
            ? safeNearbyAgenciesError(error)
            : "주변 기관을 불러오지 못했습니다. 다시 시도해 주세요.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoadingAgencies(false);
      }
    }
  }, [activeCase, nearbyAgenciesService, referenceLocation]);

  useEffect(() => {
    void loadAgencies();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadAgencies]);

  if (!activeCase) {
    return (
      <AppScreen
        footer={<Button title="홈으로 돌아가기" onPress={() => router.replace("/")} />}
        scroll={false}
      >
        <ErrorState message="활성 사건이 없습니다. 사건을 먼저 저장해 주세요." />
      </AppScreen>
    );
  }

  function handleRequestCurrentLocation() {
    setIsLoadingLocation(true);
    setLocationErrorMessage(null);
    setMapStatus("LOADING");

    setTimeout(() => {
      setReferenceLocation(mockReferenceLocation);
      setMapStatus("READY");
      setIsLoadingLocation(false);
      void loadAgencies();
    }, 250);
  }

  function handleSelectAgency(agencyId: string) {
    setSelectedAgencyId(agencyId);
  }

  function handleOpenDirections() {
    Alert.alert("길찾기 준비 중", "실제 지도 provider 연결 후 길찾기를 시작합니다.");
  }

  function handleCallAgency() {
    Alert.alert("전화하기 준비 중", "실제 전화 adapter 연결 후 기관에 전화합니다.");
  }

  return (
    <NearbyAgenciesView
      agencies={agencies}
      agenciesErrorMessage={agenciesErrorMessage}
      isLoadingAgencies={isLoadingAgencies}
      isLoadingLocation={isLoadingLocation}
      locationErrorMessage={locationErrorMessage}
      mapStatus={mapStatus}
      onBack={() => router.back()}
      onCallAgency={handleCallAgency}
      onCaseTab={() => {}}
      onDocumentsTab={() => router.replace("/case/documents" as Href)}
      onGuideTab={() => router.replace("/case/guides" as Href)}
      onOpenAllAgencies={() =>
        Alert.alert("전체 기관 목록 준비 중", "검색·필터 정책 확정 후 연결합니다.")
      }
      onOpenDirections={handleOpenDirections}
      onRequestCurrentLocation={handleRequestCurrentLocation}
      onRetryAgencies={() => void loadAgencies()}
      onSelectAgency={handleSelectAgency}
      onToggleMapLayer={() =>
        Alert.alert("지도 레이어 준비 중", "지도 provider 연결 후 사용할 수 있습니다.")
      }
      referenceLocation={referenceLocation}
      selectedAgencyId={selectedAgencyId}
      sort="DISTANCE"
    />
  );
}

function safeNearbyAgenciesError(error: NearbyAgenciesServiceError) {
  switch (error.code) {
    case "INVALID_CASE_ID":
      return "활성 사건을 확인할 수 없습니다. 사건 화면에서 다시 시작해 주세요.";
    case "INVALID_LOCATION":
    case "LOCATION_REQUIRED":
      return "현재 위치를 확인한 뒤 주변 기관을 다시 찾아 주세요.";
    case "AGENCIES_NOT_FOUND":
      return "주변 기관을 찾지 못했습니다. 검색 범위를 확인해 주세요.";
    default:
      return "주변 기관을 불러오지 못했습니다. 다시 시도해 주세요.";
  }
}
