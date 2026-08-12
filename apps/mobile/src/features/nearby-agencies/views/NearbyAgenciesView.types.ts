import type {
  DeviceLocation,
  NearbyAgency,
} from "@/features/nearby-agencies/types/nearbyAgencies";

export type NearbyAgenciesMapStatus = "READY" | "UNAVAILABLE" | "LOADING";

export type NearbyAgenciesViewProps = {
  referenceLocation: DeviceLocation | null;
  agencies: NearbyAgency[];
  selectedAgencyId: string | null;
  sort: "DISTANCE";
  isLoadingLocation: boolean;
  isLoadingAgencies: boolean;
  locationErrorMessage: string | null;
  agenciesErrorMessage: string | null;
  mapStatus: NearbyAgenciesMapStatus;
  onBack: () => void;
  onSelectAgency: (agencyId: string) => void;
  onRequestCurrentLocation: () => void;
  onOpenLocationSettings: () => void;
  onToggleMapLayer: () => void;
  onOpenDirections: () => void;
  onCallAgency: () => void;
  onOpenAllAgencies: () => void;
  onRetryAgencies: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
