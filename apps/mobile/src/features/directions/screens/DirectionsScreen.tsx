import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { nearbyAgencyFixtures } from "@/features/nearby-agencies/fixtures/nearbyAgencies";
import { externalDirectionsService } from "@/features/nearby-agencies/services/directions";
import { directionsNavigationState } from "@/features/directions/services/directionsNavigation";
import { createMockDirectionsService } from "@/features/directions/services/mockDirections";
import { createExpoLocationTrackingService } from "@/features/directions/services/expoLocationTracking";
import { createDirectionsMapProvider } from "@/features/directions/services/mapProvider";
import { LocationTrackingError } from "@/features/directions/services/locationTracking";
import type { DirectionsTravelMode, RouteGuidance } from "@/features/directions/types/directions";
import { DirectionsView } from "@/features/directions/views/DirectionsView";

const origin = { latitude: 35.6595, longitude: 139.7005, accuracyMeters: 25 };

export function DirectionsScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const directionsService = useMemo(() => createMockDirectionsService(), []);
  const trackingService = useMemo(() => createExpoLocationTrackingService(), []);
  const mapProvider = useMemo(() => createDirectionsMapProvider(), []);
  const target = directionsNavigationState.target;
  const destinationAgency = nearbyAgencyFixtures.find((agency) => agency.agencyId === target?.agencyId) ?? null;
  const [selectedTravelMode, setSelectedTravelMode] = useState<DirectionsTravelMode>("WALK");
  const [guidance, setGuidance] = useState<RouteGuidance | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(Boolean(activeCase && destinationAgency));
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const stopTrackingRef = useRef<(() => void | Promise<void>) | null>(null);
  const requestIdRef = useRef(0);

  const cleanupTracking = useCallback(async () => {
    const stop = stopTrackingRef.current;
    stopTrackingRef.current = null;
    setIsTrackingLocation(false);
    await stop?.();
  }, []);

  const loadRoute = useCallback(async (mode: DirectionsTravelMode) => {
    if (!activeCase || !destinationAgency) return;
    const requestId = ++requestIdRef.current;
    setIsLoadingRoute(true);
    setErrorMessage(null);
    try {
      const result = await directionsService.getRoute({ caseId: activeCase.caseId, accessToken: activeCase.accessToken, agencyId: destinationAgency.agencyId, travelMode: mode, origin });
      if (requestId === requestIdRef.current) setGuidance(result);
    } catch {
      if (requestId === requestIdRef.current) {
        setGuidance(null);
        setErrorMessage("경로를 확인할 수 없습니다. 외부 지도에서 다시 시도해 주세요.");
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingRoute(false);
    }
  }, [activeCase, destinationAgency, directionsService]);

  useEffect(() => {
    void loadRoute(selectedTravelMode);
    return () => { requestIdRef.current += 1; };
  }, [loadRoute, selectedTravelMode]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" && stopTrackingRef.current) {
        void cleanupTracking();
        setErrorMessage("앱이 백그라운드로 전환되어 위치 안내를 잠시 멈췄습니다.");
      }
    });
    return () => {
      subscription.remove();
      void cleanupTracking();
    };
  }, [cleanupTracking]);

  if (!activeCase) {
    return <AppScreen footer={<Button title="처음으로 돌아가기" onPress={() => router.replace("/")} />} scroll={false}><ErrorState message="활성 사건이 없습니다." /></AppScreen>;
  }
  if (!destinationAgency) {
    return <AppScreen footer={<Button title="인근 기관으로 돌아가기" onPress={() => router.replace("/case/nearby-agencies" as Href)} />} scroll={false}><ErrorState message="선택한 목적지 정보를 찾을 수 없습니다." /></AppScreen>;
  }
  const selectedDestination = destinationAgency;

  async function handleStartGuidance() {
    if (!guidance || isTrackingLocation) return;
    setGuidance((current) => current ? { ...current, routeStatus: "NAVIGATING" } : current);
    try {
      stopTrackingRef.current = await trackingService.start((location) => {
        setGuidance((current) => current ? { ...current, origin: location, updatedAt: new Date().toISOString() } : current);
      });
      setIsTrackingLocation(true);
    } catch (error) {
      setGuidance((current) => current ? { ...current, routeStatus: "READY" } : current);
      setErrorMessage(error instanceof LocationTrackingError ? error.message : "위치 안내를 시작할 수 없습니다.");
    }
  }

  async function handleConfirmArrival() {
    await cleanupTracking();
    setGuidance((current) => current ? { ...current, routeStatus: "ARRIVED" } : current);
    directionsNavigationState.clearTarget();
    router.replace("/case/police-support" as Href);
  }

  async function handleBack() {
    await cleanupTracking();
    directionsNavigationState.clearTarget();
    router.back();
  }

  async function handleOpenExternalDirections() {
    try {
      await externalDirectionsService.open({ latitude: selectedDestination.latitude, longitude: selectedDestination.longitude, label: selectedDestination.name });
    } catch {
      setErrorMessage("외부 지도 앱을 열 수 없습니다. 목적지 주소를 확인해 주세요.");
    }
  }

  return <DirectionsView destination={{ agencyId: selectedDestination.agencyId, name: selectedDestination.name, address: selectedDestination.address, latitude: selectedDestination.latitude, longitude: selectedDestination.longitude }} guidance={guidance} availableTravelModes={["WALK", "TRANSIT", "DRIVE"]} selectedTravelMode={selectedTravelMode} isLoadingRoute={isLoadingRoute} isTrackingLocation={isTrackingLocation} errorMessage={errorMessage} mapStatus={mapProvider.status} onBack={() => void handleBack()} onSelectTravelMode={(mode) => { void cleanupTracking(); setSelectedTravelMode(mode); }} onStartGuidance={() => void handleStartGuidance()} onConfirmArrival={() => void handleConfirmArrival()} onRetryRoute={() => void loadRoute(selectedTravelMode)} onOpenExternalDirections={() => void handleOpenExternalDirections()} onCaseTab={() => void handleBack()} onGuideTab={() => router.replace("/case/guides" as Href)} onDocumentsTab={() => router.replace("/case/documents" as Href)} />;
}
