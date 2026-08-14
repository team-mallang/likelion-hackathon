import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeCaseAnalysisInputForAI, sanitizeLiveContextInputForAI } from "./pii-boundaries";

test("Incident Intake OpenAI boundary replaces raw transcript and string answers", async () => {
  const result = await sanitizeCaseAnalysisInputForAI({
    initialStatement: "제 이름은 박지민이고 전화번호는 010-1234-5678입니다.",
    countryCode: "JP", type: "UNKNOWN", items: [],
    answers: [{ field: "description", value: "이메일은 guard@example.com입니다." }],
  });
  const serialized = JSON.stringify(result);
  assert.equal(result.initialStatement, "제 이름은 [NAME]이고 전화번호는 [PHONE_NUMBER]입니다.");
  assert.equal(serialized.includes("박지민"), false);
  assert.equal(serialized.includes("010-1234-5678"), false);
  assert.equal(serialized.includes("guard@example.com"), false);
});

test("Live Assistance OpenAI boundary masks current and recent transcripts", async () => {
  const result = await sanitizeLiveContextInputForAI({
    statement: "제 이름은 박지민입니다.",
    recentStatements: ["전화번호는 010-1234-5678입니다."],
    incident: { type: "STOLEN", countryCode: "JP", lastSeenAt: null, lastSeenPlace: "신주쿠역", discoveredAt: null, discoveredPlace: null, items: [] },
  });
  assert.equal(result.currentPoliceStatement, "제 이름은 [NAME]입니다.");
  assert.deepEqual(result.recentPoliceStatements, ["전화번호는 [PHONE_NUMBER]입니다."]);
  const serialized = JSON.stringify(result);
  assert.equal(serialized.includes("박지민"), false);
  assert.equal(serialized.includes("010-1234-5678"), false);
  assert.equal(serialized.includes("신주쿠역"), true);
});
