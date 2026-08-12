import assert from "node:assert/strict";
import test from "node:test";

import { createMockLocationTrackingService } from "./mockLocationTracking";

test("S13 mock tracking emits a location and stops cleanly", async () => {
  const service = createMockLocationTrackingService({ latitude: 1, longitude: 2 });
  let received = 0;
  const stop = await service.start(() => { received += 1; });
  await new Promise((resolve) => setTimeout(resolve, 160));
  assert.equal(received, 1);
  await stop();
});

test("S13 cleanup prevents a late location callback", async () => {
  const service = createMockLocationTrackingService();
  let received = 0;
  const stop = await service.start(() => { received += 1; });
  await stop();
  await new Promise((resolve) => setTimeout(resolve, 160));
  assert.equal(received, 0);
});
