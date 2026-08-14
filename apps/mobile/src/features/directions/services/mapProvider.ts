import { Platform } from "react-native";

export type DirectionsMapProviderStatus = "READY" | "UNAVAILABLE";

export type DirectionsMapProvider = { status: DirectionsMapProviderStatus };

export function createDirectionsMapProvider(): DirectionsMapProvider {
  return { status: Platform.OS === "web" ? "UNAVAILABLE" : "READY" };
}
