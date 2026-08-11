export type AgencyType =
  | "POLICE_STATION"
  | "POLICE_BOX"
  | "LOST_AND_FOUND"
  | "EMBASSY";

export type OperatingStatus = "OPEN" | "CLOSED" | "UNKNOWN";

export type TravelMode = "WALK" | "DRIVE" | "TRANSIT";

export type DeviceLocation = {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
};

export type NearbyAgency = {
  agencyId: string;
  type: AgencyType;
  name: string;
  address: string;
  phoneNumber?: string;
  latitude: number;
  longitude: number;
  operatingStatus: OperatingStatus;
  operatingStatusLabel: string;
  distanceMeters?: number;
  travelMode?: TravelMode;
  travelDurationMinutes?: number;
  isNearest: boolean;
  directionsAvailable: boolean;
};

export type NearbyAgenciesQuery = {
  caseId: string;
  accessToken?: string;
  location: DeviceLocation;
  sort: "DISTANCE";
  types?: AgencyType[];
};

export type NearbyAgenciesResult = {
  referenceLocation: DeviceLocation;
  agencies: NearbyAgency[];
  fetchedAt: string;
};
