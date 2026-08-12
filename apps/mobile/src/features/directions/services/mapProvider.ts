export type DirectionsMapProviderStatus = "READY" | "UNAVAILABLE";

export type DirectionsMapProvider = { status: DirectionsMapProviderStatus };

/** 지도 SDK 계약 전에는 정적 View의 안전한 fallback을 사용한다. */
export function createDirectionsMapProvider(): DirectionsMapProvider {
  return { status: "UNAVAILABLE" };
}
