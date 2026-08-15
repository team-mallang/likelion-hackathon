import assert from "node:assert/strict";
import test from "node:test";
import { transitStepIcon, transitStepSummary } from "./transitStepDisplay";

test("formats WALK and transit steps for rendering", () => {
  assert.equal(transitStepIcon({ order: 1, type: "WALK" }), "walk");
  assert.equal(transitStepSummary({ order: 1, type: "WALK", durationSeconds: 240, distanceMeters: 300 }), "4분 · 300m");
  assert.equal(transitStepIcon({ order: 2, type: "TRANSIT", vehicleType: "SUBWAY" }), "subway");
});

test("handles missing optional transit fields safely", () => {
  assert.equal(transitStepSummary({ order: 1, type: "TRANSIT" }), "");
  assert.equal(transitStepIcon({ order: 1, type: "TRANSIT", vehicleType: "OTHER" }), "train");
});
