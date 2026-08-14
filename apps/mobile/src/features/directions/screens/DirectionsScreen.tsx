import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { externalDirectionsService } from "@/features/nearby-agencies/services/directions";
import { directionsNavigationState } from "@/features/directions/services/directionsNavigation";
import { createExpoLocationTrackingService } from "@/features/directions/services/expoLocationTracking";
import { createDirectionsMapProvider } from "@/features/directions/services/mapProvider";
import { LocationTrackingError } from "@/features/directions/services/locationTracking";
import type { DirectionsTravelMode, RouteGuidance } from "@/features/directions/types/directions";
import { DirectionsView } from "@/features/directions/views/DirectionsView";

export function DirectionsScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const trackingService = useMemo(() => createExpoLocationTrackingService(), []);
  const mapProvider = useMemo(() => createDirectionsMapProvider(), []);
  const target = directionsNavigationState.target;
  const destinationAgency = target;
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
      const base = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
      if (!base) throw new Error("API_BASE_URL_MISSING");
      const response = await fetch(`${base}/api/cases/${activeCase.caseId}/routes`, { method: "POST", headers: { "Content-Type": "application/json", ...(activeCase.accessToken ? { Authorization: `Bearer ${activeCase.accessToken}` } : {}) }, body: JSON.stringify({ origin: destinationAgency.origin, destination: { latitude: destinationAgency.latitude, longitude: destinationAgency.longitude }, travelMode: mode }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const errorCode = typeof payload?.error === "string" ? payload.error : "ROUTE_UNAVAILABLE";
        throw new Error(errorCode);
      }
      if (requestId === requestIdRef.current) setGuidance({ agencyId: destinationAgency.agencyId, travelMode: mode, distanceMeters: payload.data.distanceMeters, durationMinutes: Math.ceil(Number(String(payload.data.duration).replace("s", "")) / 60), routeStatus: "READY", origin: destinationAgency.origin, destination: { agencyId: destinationAgency.agencyId, name: destinationAgency.name, address: destinationAgency.address, latitude: destinationAgency.latitude, longitude: destinationAgency.longitude }, polyline: payload.data.polyline ?? undefined, updatedAt: new Date().toISOString() });
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setGuidance(null);
        setErrorMessage(getRouteErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current) setIsLoadingRoute(false);
    }
  }, [activeCase, destinationAgency]);

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
      await externalDirectionsService.open({ latitude: selectedDestination.latitude, longitude: selectedDestination.longitude, label: selectedDestination.name, origin: guidance?.origin ?? selectedDestination.origin, travelMode: selectedTravelMode });
    } catch {
      setErrorMessage("외부 지도 앱을 열 수 없습니다. 목적지 주소를 확인해 주세요.");
    }
  }

  return <DirectionsView destination={{ agencyId: selectedDestination.agencyId, name: selectedDestination.name, address: selectedDestination.address, latitude: selectedDestination.latitude, longitude: selectedDestination.longitude }} guidance={guidance} availableTravelModes={["WALK", "TRANSIT", "DRIVE"]} selectedTravelMode={selectedTravelMode} isLoadingRoute={isLoadingRoute} isTrackingLocation={isTrackingLocation} errorMessage={errorMessage} mapStatus={isLoadingRoute ? "LOADING" : mapProvider.status} onBack={() => void handleBack()} onSelectTravelMode={(mode) => { void cleanupTracking(); setSelectedTravelMode(mode); }} onStartGuidance={() => void handleStartGuidance()} onConfirmArrival={() => void handleConfirmArrival()} onRetryRoute={() => void loadRoute(selectedTravelMode)} onOpenExternalDirections={() => void handleOpenExternalDirections()} onCaseTab={() => void handleBack()} onGuideTab={() => router.replace("/case/guides" as Href)} onDocumentsTab={() => router.replace("/case/documents" as Href)} />;
}

function getRouteErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "경로를 확인할 수 없습니다. 외부 지도에서 다시 시도해 주세요.";
  }

  switch (error.message) {
    case "API_BASE_URL_MISSING":
      return "앱의 API 서버 주소가 설정되지 않았습니다.";
    case "MAPS_NOT_CONFIGURED":
      return "서버에 Google Maps 경로 API 키가 설정되지 않았습니다.";
    case "UNAUTHORIZED":
    case "INVALID_TOKEN":
      return "사건 인증이 만료되었습니다. 사건을 다시 불러와 주세요.";
    case "ROUTE_NOT_FOUND":
      return "선택한 이동수단의 경로를 찾지 못했습니다.";
    default:
      return "경로를 확인할 수 없습니다. API 서버와 Google Routes API 설정을 확인해 주세요.";
  }
}
