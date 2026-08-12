import assert from "node:assert/strict";
import test from "node:test";

import {
  formatRouteDistance,
  formatRouteDuration,
  getRouteCtaDisplay,
  getTravelModeDisplay,
  resolveTravelMode,
} from "./directionDisplay";

test("S13 maps each travel mode to visible and accessible text", () => {
  assert.deepEqual(getTravelModeDisplay("WALK"), {
    label: "도보",
    accessibilityLabel: "도보 경로",
    iconName: "walk",
  });
  assert.equal(getTravelModeDisplay("TRANSIT").label, "대중교통");
  assert.equal(getTravelModeDisplay("DRIVE").label, "차량");
});

test("S13 maps route state to an explicit CTA and next action", () => {
  assert.equal(getRouteCtaDisplay("READY").label, "경로 안내 시작");
  assert.equal(getRouteCtaDisplay("NAVIGATING").label, "도착했어요");
  assert.equal(getRouteCtaDisplay("ARRIVED").label, "경찰 지원 시작");
  assert.equal(getRouteCtaDisplay("FAILED").label, "경로 다시 확인");
});

test("S13 does not render missing or invalid route data as a successful value", () => {
  assert.equal(formatRouteDistance(undefined), "거리 확인 불가");
  assert.equal(formatRouteDistance(-1), "거리 확인 불가");
  assert.equal(formatRouteDistance(450), "450m");
  assert.equal(formatRouteDistance(1250), "1.3km");
  assert.equal(formatRouteDuration(undefined), "시간 확인 불가");
  assert.equal(formatRouteDuration(-1), "시간 확인 불가");
  assert.equal(formatRouteDuration(6.5), "7분");
});

test("S13 keeps a supported choice and falls back safely when it is unavailable", () => {
  assert.equal(resolveTravelMode(["WALK", "TRANSIT"], "TRANSIT"), "TRANSIT");
  assert.equal(resolveTravelMode(["WALK", "TRANSIT"], "DRIVE"), "WALK");
  assert.equal(resolveTravelMode(["DRIVE", "TRANSIT"], "WALK"), "DRIVE");
  assert.equal(resolveTravelMode([], "WALK"), null);
});
