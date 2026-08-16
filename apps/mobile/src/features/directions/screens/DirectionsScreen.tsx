import { useRouter, type Href } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { externalDirectionsService } from "@/features/nearby-agencies/services/directions";
import { directionsNavigationState, getPoliceSupportRoute } from "@/features/directions/services/directionsNavigation";
import { createExpoLocationTrackingService } from "@/features/directions/services/expoLocationTracking";
import { createDirectionsMapProvider } from "@/features/directions/services/mapProvider";
import { LocationTrackingError } from "@/features/directions/services/locationTracking";
import type { DirectionsTravelMode, RouteGuidance, TransitRouteStep } from "@/features/directions/types/directions";
import { DirectionsView } from "@/features/directions/views/DirectionsView";

export function DirectionsScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const trackingService = useMemo(() => createExpoLocationTrackingService(), []);
  const mapProvider = useMemo(() => createDirectionsMapProvider(), []);
  const target = directionsNavigationState.target;
  const destinationAgency = target;
  const [selectedTravelMode, setSelectedTravelMode] = useState<DirectionsTravelMode>("WALK");
  const [routeOptions, setRouteOptions] = useState<RouteGuidance[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(Boolean(activeCase && destinationAgency));
  const [isTrackingLocation, setIsTrackingLocation] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(() => Date.now());
  const stopTrackingRef = useRef<(() => void | Promise<void>) | null>(null);
  const requestIdRef = useRef(0);
  const selectedRoute = routeOptions.find((route) => route.routeId === selectedRouteId) ?? routeOptions[0] ?? null;

  const cleanupTracking = useCallback(async () => {
    const stop = stopTrackingRef.current;
    stopTrackingRef.current = null;
    setIsTrackingLocation(false);
    await stop?.();
  }, []);

  const loadRoute = useCallback(async (mode: DirectionsTravelMode, options: { preserveExisting?: boolean } = {}) => {
    if (!activeCase || !destinationAgency) return;
    const preserveExisting = options.preserveExisting === true;
    const requestId = ++requestIdRef.current;
    if (!preserveExisting) {
      setIsLoadingRoute(true);
      setRouteOptions([]);
      setSelectedRouteId(null);
      setErrorMessage(null);
    }
    try {
      const base = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
      if (!base) throw new Error("API_BASE_URL_MISSING");
      const response = await fetch(`${base}/api/cases/${activeCase.caseId}/routes`, { method: "POST", headers: { "Content-Type": "application/json", ...(activeCase.accessToken ? { Authorization: `Bearer ${activeCase.accessToken}` } : {}) }, body: JSON.stringify({ origin: destinationAgency.origin, destination: { latitude: destinationAgency.latitude, longitude: destinationAgency.longitude }, travelMode: mode }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const errorCode = typeof payload?.error === "string" ? payload.error : "ROUTE_UNAVAILABLE";
        throw new Error(errorCode);
      }
      if (!Array.isArray(payload?.data?.routes) || payload.data.routes.length === 0) {
        throw new Error("ROUTE_NOT_FOUND");
      }
      const destination = {
        agencyId: destinationAgency.agencyId,
        name: destinationAgency.name,
        address: destinationAgency.address,
        latitude: destinationAgency.latitude,
        longitude: destinationAgency.longitude,
      };
      const updatedAt = new Date().toISOString();
      const routes: RouteGuidance[] = payload.data.routes.map((route: Record<string, unknown>, index: number): RouteGuidance => ({
        routeId: typeof route.routeId === "string" ? route.routeId : `route-${index}`,
        routePreference: route.routePreference === "FEWER_TRANSFERS" || route.routePreference === "LESS_WALKING" || route.routePreference === "DEFAULT" ? route.routePreference : undefined,
        agencyId: destinationAgency.agencyId,
        travelMode: mode,
        distanceMeters: typeof route.distanceMeters === "number" ? route.distanceMeters : undefined,
        durationMinutes: parseDurationMinutes(route.duration),
        routeStatus: "READY",
        origin: destinationAgency.origin,
        destination,
        polyline: typeof route.polyline === "string" ? route.polyline : undefined,
        transitSteps: Array.isArray(route.transitSteps) ? route.transitSteps as TransitRouteStep[] : undefined,
        updatedAt,
      }));
      if (requestId === requestIdRef.current) {
        setRouteOptions(routes);
        setSelectedRouteId((current) => preserveExisting && current && routes.some((route) => route.routeId === current) ? current : routes[0]?.routeId ?? null);
        setClockNow(Date.now());
      }
    } catch (error) {
      if (requestId === requestIdRef.current && !preserveExisting) {
        setRouteOptions([]);
        setSelectedRouteId(null);
        setErrorMessage(getRouteErrorMessage(error));
      }
    } finally {
      if (requestId === requestIdRef.current && !preserveExisting) setIsLoadingRoute(false);
    }
  }, [activeCase, destinationAgency]);

  useEffect(() => {
    void loadRoute(selectedTravelMode);
    return () => { requestIdRef.current += 1; };
  }, [loadRoute, selectedTravelMode]);

  useEffect(() => {
    if (selectedTravelMode !== "TRANSIT") return;
    const clockTimer = setInterval(() => setClockNow(Date.now()), 30_000);
    return () => clearInterval(clockTimer);
  }, [selectedTravelMode]);

  useEffect(() => {
    if (selectedTravelMode !== "TRANSIT" || routeOptions.length === 0 || isTrackingLocation) return;
    const refreshTimer = setInterval(() => void loadRoute(selectedTravelMode, { preserveExisting: true }), 60_000);
    return () => clearInterval(refreshTimer);
  }, [isTrackingLocation, loadRoute, routeOptions.length, selectedTravelMode]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        setClockNow(Date.now());
        if (selectedTravelMode === "TRANSIT") void loadRoute(selectedTravelMode, { preserveExisting: true });
      }
      if (nextState !== "active" && stopTrackingRef.current) {
        void cleanupTracking();
        setErrorMessage("앱이 백그라운드로 전환되어 위치 안내를 잠시 멈췄습니다.");
      }
    });
    return () => {
      subscription.remove();
      void cleanupTracking();
    };
  }, [cleanupTracking, loadRoute, selectedTravelMode]);

  if (!activeCase) {
    return <AppScreen footer={<Button title="처음으로 돌아가기" onPress={() => router.replace("/")} />} scroll={false}><ErrorState message="활성 사건이 없습니다." /></AppScreen>;
  }
  if (!destinationAgency) {
    return <AppScreen footer={<Button title="인근 기관으로 돌아가기" onPress={() => router.replace("/case/nearby-agencies" as Href)} />} scroll={false}><ErrorState message="선택한 목적지 정보를 찾을 수 없습니다." /></AppScreen>;
  }
  const selectedDestination = destinationAgency;

  async function handleStartGuidance() {
    if (!selectedRoute || isTrackingLocation) return;
    const routeId = selectedRoute.routeId;
    updateRoute(routeId, { routeStatus: "NAVIGATING" });
    try {
      stopTrackingRef.current = await trackingService.start((location) => {
        updateRoute(routeId, { origin: location, updatedAt: new Date().toISOString() });
      });
      setIsTrackingLocation(true);
    } catch (error) {
      updateRoute(routeId, { routeStatus: "READY" });
      setErrorMessage(error instanceof LocationTrackingError ? error.message : "위치 안내를 시작할 수 없습니다.");
    }
  }

  async function handleConfirmArrival() {
    try {
      await cleanupTracking();
    } catch {
      // A location subscription cleanup failure must not block manual arrival.
    }
    if (selectedRoute) updateRoute(selectedRoute.routeId, { routeStatus: "ARRIVED" });
    directionsNavigationState.clearTarget();
    router.replace(getPoliceSupportRoute() as Href);
  }

  async function handleBack() {
    await cleanupTracking();
    directionsNavigationState.clearTarget();
    router.back();
  }

  async function handleOpenExternalDirections() {
    try {
      await externalDirectionsService.open({ latitude: selectedDestination.latitude, longitude: selectedDestination.longitude, label: selectedDestination.name, origin: selectedRoute?.origin ?? selectedDestination.origin, travelMode: selectedTravelMode });
    } catch {
      setErrorMessage("외부 지도 앱을 열 수 없습니다. 목적지 주소를 확인해 주세요.");
    }
  }

  function updateRoute(routeId: string, updates: Partial<RouteGuidance>) {
    setRouteOptions((current) => current.map((route) => route.routeId === routeId ? { ...route, ...updates } : route));
  }

  return <DirectionsView
    destination={{ agencyId: selectedDestination.agencyId, name: selectedDestination.name, address: selectedDestination.address, latitude: selectedDestination.latitude, longitude: selectedDestination.longitude }}
    origin={selectedRoute?.origin ?? selectedDestination.origin}
    routeOptions={routeOptions}
    selectedRoute={selectedRoute}
    nowMs={clockNow}
    availableTravelModes={["WALK", "TRANSIT", "DRIVE"]}
    selectedTravelMode={selectedTravelMode}
    isLoadingRoute={isLoadingRoute}
    isTrackingLocation={isTrackingLocation}
    errorMessage={errorMessage}
    mapStatus={isLoadingRoute ? "LOADING" : mapProvider.status}
    onBack={() => void handleBack()}
    onSelectTravelMode={(mode) => { void cleanupTracking(); setSelectedTravelMode(mode); }}
    onSelectRoute={(routeId) => { if (!isTrackingLocation) setSelectedRouteId(routeId); }}
    onStartGuidance={() => void handleStartGuidance()}
    onConfirmArrival={() => void handleConfirmArrival()}
    onArrivedAtPoliceStation={() => void handleConfirmArrival()}
    onRetryRoute={() => void loadRoute(selectedTravelMode)}
    onOpenExternalDirections={() => void handleOpenExternalDirections()}
    onCaseTab={() => void handleBack()}
    onGuideTab={() => router.replace("/case/guides" as Href)}
    onDocumentsTab={() => router.replace("/case/documents" as Href)}
  />;
}

function parseDurationMinutes(duration: unknown) {
  if (typeof duration !== "string") return undefined;
  const seconds = Number.parseFloat(duration);
  return Number.isFinite(seconds) ? Math.ceil(seconds / 60) : undefined;
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
