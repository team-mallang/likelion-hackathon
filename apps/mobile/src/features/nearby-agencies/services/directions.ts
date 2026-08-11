export type DirectionsTarget = {
  latitude: number;
  longitude: number;
  label: string;
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

    const url = `https://www.google.com/maps/dir/?api=1&destination=${target.latitude},${target.longitude}`;

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
