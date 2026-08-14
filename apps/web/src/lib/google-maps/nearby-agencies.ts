export type NearbyAgencyType = "POLICE_STATION" | "EMBASSY";

export type NearbyAgencyLocation = {
  latitude: number;
  longitude: number;
};

export type GoogleNearbyAgency = {
  agencyId: string;
  type: NearbyAgencyType;
  name: string;
  address: string;
  phoneNumber?: string;
  latitude: number;
  longitude: number;
  operatingStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  operatingStatusLabel: string;
  distanceMeters: number;
  isNearest: boolean;
  directionsAvailable: true;
};

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  location?: { latitude?: number; longitude?: number };
  currentOpeningHours?: { openNow?: boolean };
};

type GoogleSearchResponse = { places?: GooglePlace[] };

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.location",
  "places.currentOpeningHours.openNow",
].join(",");

function getApiKey() {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY?.trim();
  if (!key) throw new Error("GOOGLE_MAPS_SERVER_API_KEY is not configured.");
  return key;
}

function distanceMeters(from: NearbyAgencyLocation, to: NearbyAgencyLocation) {
  const radius = 6_371_000;
  const radians = (value: number) => (value * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return Math.round(radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

async function searchPlaces(textQuery: string, location: NearbyAgencyLocation) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": getApiKey(),
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      locationBias: {
        circle: { center: location, radius: 15_000 },
      },
      maxResultCount: 10,
      languageCode: "ko",
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places request failed with ${response.status}.`);
  }

  return (await response.json()) as GoogleSearchResponse;
}

function toAgency(place: GooglePlace, type: NearbyAgencyType, location: NearbyAgencyLocation): GoogleNearbyAgency | null {
  const latitude = place.location?.latitude;
  const longitude = place.location?.longitude;
  const name = place.displayName?.text?.trim();
  if (!place.id || !name || !place.formattedAddress || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;

  const openNow = place.currentOpeningHours?.openNow;
  return {
    agencyId: `google:${place.id}`,
    type,
    name,
    address: place.formattedAddress,
    phoneNumber: place.internationalPhoneNumber ?? place.nationalPhoneNumber,
    latitude: latitude as number,
    longitude: longitude as number,
    operatingStatus: openNow === true ? "OPEN" : openNow === false ? "CLOSED" : "UNKNOWN",
    operatingStatusLabel: openNow === true ? "운영 중" : openNow === false ? "운영 종료" : "운영 시간 확인 필요",
    distanceMeters: distanceMeters(location, { latitude: latitude as number, longitude: longitude as number }),
    isNearest: false,
    directionsAvailable: true,
  };
}

export async function findNearbyAgencies(location: NearbyAgencyLocation, types: NearbyAgencyType[]) {
  const requestedTypes = types.length ? types : ["POLICE_STATION", "EMBASSY"] as const;
  const queries = requestedTypes.map((type) => ({ type, textQuery: type === "EMBASSY" ? "주재 대한민국 대사관" : "경찰서" }));
  const results = await Promise.all(queries.map(async ({ type, textQuery }) => {
    const response = await searchPlaces(textQuery, location);
    return (response.places ?? []).map((place) => toAgency(place, type, location)).filter((place): place is GoogleNearbyAgency => place !== null);
  }));

  const unique = new Map<string, GoogleNearbyAgency>();
  for (const agency of results.flat()) unique.set(agency.agencyId, agency);
  const agencies = [...unique.values()].sort((a, b) => a.distanceMeters - b.distanceMeters);
  if (agencies[0]) agencies[0].isNearest = true;
  return agencies;
}
