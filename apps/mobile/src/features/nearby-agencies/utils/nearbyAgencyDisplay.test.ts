import assert from "node:assert/strict";
import test from "node:test";

import type { NearbyAgency } from "@/features/nearby-agencies/types/nearbyAgencies";

import {
  formatDistance,
  formatTravelTime,
  getAgencyTypeLabel,
  getOperatingStatusLabel,
  getTravelModeLabel,
  resolveSelectedAgencyId,
  sortNearbyAgencies,
} from "./nearbyAgencyDisplay";

const agency = (agencyId: string, distanceMeters?: number): NearbyAgency => ({
  agencyId,
  type: "POLICE_STATION",
  name: agencyId,
  address: "도쿄도 시부야구",
  latitude: 35.6595,
  longitude: 139.7005,
  operatingStatus: "OPEN",
  operatingStatusLabel: "운영 중",
  distanceMeters,
  isNearest: false,
  directionsAvailable: true,
});

test("S12 maps agency, status, and travel types to explicit labels", () => {
  assert.equal(getAgencyTypeLabel("POLICE_BOX"), "파출소");
  assert.equal(getOperatingStatusLabel("UNKNOWN"), "운영 시간 확인 필요");
  assert.equal(getTravelModeLabel("WALK"), "도보");
});

test("S12 formats unknown distance and time without inventing zero values", () => {
  assert.equal(formatDistance(undefined), "거리 확인 불가");
  assert.equal(formatDistance(450), "450m");
  assert.equal(formatDistance(1250), "1.3km");
  assert.equal(formatTravelTime(undefined), "시간 확인 불가");
  assert.equal(formatTravelTime(6.4), "6분");
});

test("S12 sorts known distances first and does not mutate the input", () => {
  const agencies = [agency("unknown"), agency("far", 1200), agency("near", 450)];
  const sorted = sortNearbyAgencies(agencies);

  assert.deepEqual(
    sorted.map((item) => item.agencyId),
    ["near", "far", "unknown"],
  );
  assert.deepEqual(
    agencies.map((item) => item.agencyId),
    ["unknown", "far", "near"],
  );
});

test("S12 keeps a valid selection and falls back to nearest or first agency", () => {
  const agencies = [agency("first", 850), { ...agency("nearest", 450), isNearest: true }];

  assert.equal(resolveSelectedAgencyId(agencies, "first"), "first");
  assert.equal(resolveSelectedAgencyId(agencies, "removed"), "nearest");
  assert.equal(resolveSelectedAgencyId([], "removed"), null);
});
