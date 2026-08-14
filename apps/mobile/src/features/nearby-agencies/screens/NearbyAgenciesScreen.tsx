import { useLocalSearchParams, useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Linking } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { apiNearbyAgenciesService } from "@/features/nearby-agencies/services/apiNearbyAgencies";
import {
  createExpoLocationPermissionService,
} from "@/features/nearby-agencies/services/locationPermission";
import {
  externalPhoneCallService,
  PhoneCallServiceError,
} from "@/features/nearby-agencies/services/phoneCall";
import { directionsNavigationState } from "@/features/directions/services/directionsNavigation";
import { NearbyAgenciesServiceError } from "@/features/nearby-agencies/services/nearbyAgencies";
import type {
  DeviceLocation,
  NearbyAgency,
} from "@/features/nearby-agencies/types/nearbyAgencies";
import { NearbyAgenciesView } from "@/features/nearby-agencies/views/NearbyAgenciesView";
import { resolveSelectedAgencyId } from "@/features/nearby-agencies/utils/nearbyAgencyDisplay";

export function NearbyAgenciesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    autoLocate?: string;
  }>();
  const { activeCase } = useActiveCase();
  const nearbyAgenciesService = apiNearbyAgenciesService;
  const locationService = useMemo(
    () => createExpoLocationPermissionService(),
    [],
  );
  const [referenceLocation, setReferenceLocation] =
    useState<DeviceLocation | null>(null);
  const [agencies, setAgencies] = useState<NearbyAgency[]>([]);
  const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoadingAgencies, setIsLoadingAgencies] = useState(false);
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
  const didAutoLocateRef = useRef(false);
  const requestedAgencyType =
    params.type === "POLICE_STATION" ? "POLICE_STATION" : null;

  const handleRequestCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationErrorMessage(null);
    setMapStatus("LOADING");

    try {
      let permission = await locationService.getStatus();

      if (permission.status !== "granted") {
        permission = await locationService.request();
      }

      if (permission.status !== "granted") {
        setLocationErrorMessage(
          permission.canAskAgain
            ? "주변 기관을 찾으려면 위치 권한이 필요합니다."
            : "위치 권한이 꺼져 있습니다. 기기 설정에서 권한을 허용해 주세요.",
        );
        setMapStatus("READY");
        return;
      }

      const location = await locationService.getCurrentLocation();
      setReferenceLocation(location);
      setMapStatus("READY");
    } catch {
      setMapStatus("READY");
      setLocationErrorMessage(
        "현재 위치를 확인하지 못했습니다. 기존 위치 또는 기관 목록을 확인해 주세요.",
      );
    } finally {
      setIsLoadingLocation(false);
    }
  }, [locationService]);

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
        types: requestedAgencyType ? [requestedAgencyType] : undefined,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setAgencies(result.agencies);
      setSelectedAgencyId((current) =>
        resolveSelectedAgencyId(result.agencies, current),
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
  }, [activeCase, nearbyAgenciesService, referenceLocation, requestedAgencyType]);

  useEffect(() => {
    if (referenceLocation) void loadAgencies();
    return () => {
      requestIdRef.current += 1;
    };
  }, [loadAgencies, referenceLocation]);

  useEffect(() => {
    if (
      activeCase &&
      params.autoLocate === "1" &&
      !didAutoLocateRef.current
    ) {
      didAutoLocateRef.current = true;
      void handleRequestCurrentLocation();
    }
  }, [activeCase, handleRequestCurrentLocation, params.autoLocate]);

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

  function handleSelectAgency(agencyId: string) {
    setSelectedAgencyId(agencyId);
  }

  async function handleOpenLocationSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setLocationErrorMessage(
        "기기 설정을 열지 못했습니다. 설정 앱에서 위치 권한을 허용해 주세요.",
      );
    }
  }

  async function handleOpenDirections() {
    const selectedAgency = agencies.find(
      (agency) => agency.agencyId === selectedAgencyId,
    );

    if (!selectedAgency) {
      return;
    }

    if (!referenceLocation) return;
    directionsNavigationState.setTarget({ agencyId: selectedAgency.agencyId, placeId: selectedAgency.agencyId.replace(/^google:/, ""), name: selectedAgency.name, address: selectedAgency.address, latitude: selectedAgency.latitude, longitude: selectedAgency.longitude, origin: referenceLocation, distanceMeters: selectedAgency.distanceMeters });
    router.push("/case/directions" as Href);
  }

  async function handleCallAgency() {
    const selectedAgency = agencies.find(
      (agency) => agency.agencyId === selectedAgencyId,
    );

    if (!selectedAgency?.phoneNumber) {
      Alert.alert("전화번호 없음", "이 기관의 전화번호를 확인할 수 없습니다.");
      return;
    }

    try {
      await externalPhoneCallService.call(selectedAgency.phoneNumber);
    } catch (error) {
      Alert.alert(
        "전화를 시작하지 못했습니다.",
        error instanceof PhoneCallServiceError && error.code === "NOT_SUPPORTED"
          ? "이 기기에서는 전화 기능을 사용할 수 없습니다. 전화번호를 확인해 주세요."
          : "잠시 후 다시 시도해 주세요.",
      );
    }
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
      onOpenLocationSettings={() => void handleOpenLocationSettings()}
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
