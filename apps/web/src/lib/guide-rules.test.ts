import assert from "node:assert/strict";
import { test } from "node:test";

import { createGuideSteps } from "./guide-rules";

test("stolen wallet with a credit card blocks the card before police reporting", () => {
  const steps = createGuideSteps({
    type: "STOLEN",
    items: [
      {
        name: "지갑",
        description: "신용카드가 들어 있는 검은 지갑",
        quantity: 1,
      },
    ],
  });

  assert.deepEqual(
    steps.map((step) => step.title),
    [
      "결제카드 즉시 정지",
      "현지 경찰에 사건 신고",
      "사건 정보와 처리 기록 보관",
    ],
  );
  assert.deepEqual(
    steps.map((step) => step.stepOrder),
    [1, 2, 3],
  );
});

test("lost passport includes police and consular procedures", () => {
  const steps = createGuideSteps({
    type: "LOST",
    items: [{ name: "여권", quantity: 1 }],
  });

  assert.deepEqual(
    steps.map((step) => step.title),
    [
      "현지 경찰에 사건 신고",
      "마지막 확인 장소와 분실물 센터에 문의",
      "대사관 또는 영사관에 여권 분실 신고",
      "사건 정보와 처리 기록 보관",
    ],
  );
});

test("simple lost property does not add unrelated emergency actions", () => {
  const steps = createGuideSteps({
    type: "LOST",
    items: [{ name: "우산", quantity: 1 }],
  });

  assert.deepEqual(
    steps.map((step) => step.title),
    [
      "마지막 확인 장소와 분실물 센터에 문의",
      "사건 정보와 처리 기록 보관",
    ],
  );
});

test("UNKNOWN cases provide a classification step without assuming theft", () => {
  const steps = createGuideSteps({
    type: "UNKNOWN",
    items: [{ name: "가방", quantity: 1 }],
  });

  assert.deepEqual(
    steps.map((step) => step.title),
    ["분실·도난 정황 확인", "사건 정보와 처리 기록 보관"],
  );
  assert.equal(
    steps.some((step) => step.title === "현지 경찰에 사건 신고"),
    false,
  );
});

test("matching multiple card items creates only one card-blocking step", () => {
  const steps = createGuideSteps({
    type: "STOLEN",
    items: [
      { name: "신용카드", quantity: 1 },
      { name: "체크카드", quantity: 1 },
    ],
  });

  assert.equal(
    steps.filter((step) => step.title === "결제카드 즉시 정지").length,
    1,
  );
});

test("phone rules match normalized Korean and English item descriptions", () => {
  const steps = createGuideSteps({
    type: "LOST",
    items: [
      {
        name: "전자기기",
        description: "Smart Phone",
        quantity: 1,
      },
    ],
  });

  assert.equal(steps[0]?.title, "휴대폰 회선 정지 및 원격 잠금");
});
