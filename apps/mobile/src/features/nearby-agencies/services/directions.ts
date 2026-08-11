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
