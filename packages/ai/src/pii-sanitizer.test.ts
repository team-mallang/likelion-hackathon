import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeTextForAI } from "./pii-sanitizer";

test("sanitizeTextForAI returns deterministic type-only metadata", async () => {
  const raw = "제 이름은 박지민이고 전화번호는 010-1234-5678입니다.";
  const first = await sanitizeTextForAI(raw);
  const second = await sanitizeTextForAI(raw);
  assert.deepEqual(first, second);
  assert.equal(first.text, "제 이름은 [NAME]이고 전화번호는 [PHONE_NUMBER]입니다.");
  assert.deepEqual(first.detections, [{ type: "NAME" }, { type: "PHONE_NUMBER" }]);
  assert.equal(JSON.stringify(first).includes("박지민"), false);
  assert.equal(JSON.stringify(first).includes("010-1234-5678"), false);
});

test("sanitizeTextForAI preserves incident identifiers and facts", async () => {
  const values = [
    "사건번호는 010-1234-5678입니다.",
    "호텔 예약번호는 M12345678입니다.",
    "항공편 번호는 JL123입니다.",
    "20시 10분에 확인했습니다.",
    "2026-08-13에 발생했습니다.",
    "현금 10000엔과 카드 2장이 있었습니다.",
  ];
  for (const value of values) assert.equal((await sanitizeTextForAI(value)).text, value);
});
