import type {
  DirectionsDestination,
  DirectionsTravelMode,
  RouteGuidance,
} from "@/features/directions/types/directions";
import type { DeviceLocation } from "@/features/nearby-agencies/types/nearbyAgencies";

export type DirectionsMapStatus = "READY" | "LOADING" | "UNAVAILABLE";

export type DirectionsViewProps = {
  destination: DirectionsDestination | null;
  origin: DeviceLocation | null;
  routeOptions: RouteGuidance[];
  selectedRoute: RouteGuidance | null;
  nowMs: number;
  availableTravelModes: DirectionsTravelMode[];
  selectedTravelMode: DirectionsTravelMode | null;
  isLoadingRoute: boolean;
  isTrackingLocation: boolean;
  errorMessage: string | null;
  mapStatus: DirectionsMapStatus;
  onBack: () => void;
  onSelectTravelMode: (mode: DirectionsTravelMode) => void;
  onSelectRoute: (routeId: string) => void;
  onStartGuidance: () => void;
  onConfirmArrival: () => void;
  onArrivedAtPoliceStation: () => void;
  onRetryRoute: () => void;
  onOpenExternalDirections: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
