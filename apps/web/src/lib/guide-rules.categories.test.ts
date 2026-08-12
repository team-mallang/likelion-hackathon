import assert from "node:assert/strict";
import { test } from "node:test";

import { createGuideSteps } from "./guide-rules";

test("structured categories generate each applicable guide exactly once", () => {
  const steps = createGuideSteps({
    type: "STOLEN",
    items: [
      { name: "item-a", category: "CARD", quantity: 1 },
      { name: "item-b", category: "PHONE", quantity: 1 },
      { name: "item-c", category: "PASSPORT", quantity: 1 },
    ],
  });

  assert.deepEqual(
    steps.map((step) => step.priority),
    [100, 95, 90, 70, 50],
  );
  assert.deepEqual(
    steps.map((step) => step.stepOrder),
    [1, 2, 3, 4, 5],
  );
});
