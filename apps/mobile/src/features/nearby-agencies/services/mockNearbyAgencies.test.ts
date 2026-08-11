import assert from "node:assert/strict";
import test from "node:test";

import { createMockNearbyAgenciesService } from "./mockNearbyAgencies";
import { NearbyAgenciesServiceError } from "./nearbyAgencies";

const query = {
  caseId: "case-nearby",
  location: { latitude: 35.6595, longitude: 139.7005 },
  sort: "DISTANCE" as const,
};

test("S12 mock service returns typed agencies and reference location", async () => {
  const service = createMockNearbyAgenciesService({ delayMs: 0 });
  const result = await service.getNearbyAgencies(query);

  assert.equal(result.referenceLocation.latitude, query.location.latitude);
  assert.equal(result.agencies.length, 4);
  assert.equal(result.agencies.some((agency) => agency.isNearest), true);
});

test("S12 mock service supports an explicit empty result", async () => {
  const service = createMockNearbyAgenciesService({ delayMs: 0, empty: true });
  const result = await service.getNearbyAgencies(query);

  assert.deepEqual(result.agencies, []);
});

test("S12 mock service exposes safe typed failures", async () => {
  const service = createMockNearbyAgenciesService({ delayMs: 0, failLoad: true });

  await assert.rejects(
    () => service.getNearbyAgencies(query),
    (error: unknown) =>
      error instanceof NearbyAgenciesServiceError && error.code === "NETWORK_ERROR",
  );

  await assert.rejects(
    () =>
      service.getNearbyAgencies({
        ...query,
        location: { latitude: Number.NaN, longitude: query.location.longitude },
      }),
    (error: unknown) =>
      error instanceof NearbyAgenciesServiceError && error.code === "INVALID_LOCATION",
  );
});
