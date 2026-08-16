import assert from "node:assert/strict";
import test from "node:test";
import { transitStepArrivalTime, transitStepDepartureTime, transitStepHeadway, transitStepIcon, transitStepSummary, transitStepWaitTime } from "./transitStepDisplay";

test("formats WALK and transit steps for rendering", () => {
  assert.equal(transitStepIcon({ order: 1, type: "WALK" }), "walk");
  assert.equal(transitStepSummary({ order: 1, type: "WALK", durationSeconds: 240, distanceMeters: 300 }), "4분 · 300m");
  assert.equal(transitStepIcon({ order: 2, type: "TRANSIT", vehicleType: "SUBWAY" }), "subway");
});

test("handles missing optional transit fields safely", () => {
  assert.equal(transitStepSummary({ order: 1, type: "TRANSIT" }), "");
  assert.equal(transitStepIcon({ order: 1, type: "TRANSIT", vehicleType: "OTHER" }), "train");
});

test("formats transit schedule and expected wait information", () => {
  const step = {
    order: 1,
    type: "TRANSIT" as const,
    departureTime: "2026-08-17T06:10:00Z",
    arrivalTime: "2026-08-17T06:30:00Z",
    localizedDepartureTime: "오후 3:10",
    localizedArrivalTime: "오후 3:30",
    headwaySeconds: 600,
  };

  assert.equal(transitStepDepartureTime(step), "오후 3:10");
  assert.equal(transitStepArrivalTime(step), "오후 3:30");
  assert.equal(transitStepWaitTime(step, Date.parse("2026-08-17T06:07:30Z")), "약 3분 후");
  assert.equal(transitStepHeadway(step), "배차 간격 약 10분");
});
