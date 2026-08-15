import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveGuideAction } from "./guideAction";

test("maps a Korean police visit guide to the nearby police flow", () => {
  assert.deepEqual(
    resolveGuideAction({
      title: "현지 경찰서에 사건 신고",
      institutionName: "현지 경찰",
    }),
    {
      actionType: "NEARBY_AGENCIES",
      actionLabel: "가까운 경찰서 찾기",
    },
  );
});

test("maps the standard police report step without relying on a keyword match", () => {
  assert.deepEqual(
    resolveGuideAction({
      title: "지역 경찰서에 사건 신고",
      institutionName: "지역 경찰서",
    }),
    {
      actionType: "NEARBY_AGENCIES",
      actionLabel: "가까운 경찰서 찾기",
    },
  );
});

test("maps the standard police report priority without relying on a keyword match", () => {
  assert.deepEqual(
    resolveGuideAction({
      title: "Incident reporting",
      institutionName: null,
      priority: 90,
    }),
    {
      actionType: "NEARBY_AGENCIES",
      actionLabel: "가까운 경찰서 찾기",
    },
  );
});

test("maps an English police institution to the nearby police flow", () => {
  assert.equal(
    resolveGuideAction({
      title: "Report the incident",
      institutionName: "Police station",
    }).actionType,
    "NEARBY_AGENCIES",
  );
});

test("does not add a map action to unrelated guides", () => {
  assert.deepEqual(
    resolveGuideAction({
      title: "결제카드 즉시 정지",
      institutionName: "카드사",
    }),
    { actionType: "NONE", actionLabel: null },
  );
});
