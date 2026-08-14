export type DirectionsTarget = {
  latitude: number;
  longitude: number;
  label: string;
  origin?: { latitude: number; longitude: number };
  travelMode?: "WALK" | "TRANSIT" | "DRIVE";
};

export type DirectionsServiceErrorCode =
  | "NOT_SUPPORTED"
  | "TARGET_UNAVAILABLE"
  | "OPEN_FAILED";

export class DirectionsServiceError extends Error {
  constructor(public readonly code: DirectionsServiceErrorCode) {
    super("길찾기를 시작하지 못했습니다.");
    this.name = "DirectionsServiceError";
  }
}

export type DirectionsService = {
  open(target: DirectionsTarget): Promise<void>;
};

export const externalDirectionsService: DirectionsService = {
  async open(target) {
    if (!Number.isFinite(target.latitude) || !Number.isFinite(target.longitude)) {
      throw new DirectionsServiceError("TARGET_UNAVAILABLE");
    }

    const mode = target.travelMode === "WALK" ? "walking" : target.travelMode === "TRANSIT" ? "transit" : "driving";
    const origin = target.origin ? `&origin=${target.origin.latitude},${target.origin.longitude}` : "";
    const url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}${origin}&travelmode=${mode}`;

    if (!(await Linking.canOpenURL(url))) {
      throw new DirectionsServiceError("NOT_SUPPORTED");
    }

    try {
      await Linking.openURL(url);
    } catch {
      throw new DirectionsServiceError("OPEN_FAILED");
    }
  },
};
import { Linking } from "react-native";
