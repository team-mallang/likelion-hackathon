import assert from "node:assert/strict";
import { test } from "node:test";

import { emailBody, emailSubject, isValidExportEmail } from "./exportDeliveryModel";

test("export email validation accepts basic addresses and rejects empty/invalid values", () => {
  assert.equal(isValidExportEmail("person@example.com"), true);
  assert.equal(isValidExportEmail(""), false);
  assert.equal(isValidExportEmail("person@example"), false);
});

test("export email subject and body contain only case number context", () => {
  assert.equal(emailSubject("CASE-001"), "[Travel Guard] 사건 자료 - CASE-001");
  assert.match(emailBody("CASE-001"), /사건 카드/);
  assert.match(emailBody("CASE-001"), /경찰 신고서 일본어 제출용 초안/);
  assert.match(emailBody("CASE-001"), /경찰 신고서 한국어 확인본/);
  assert.match(emailBody("CASE-001"), /사건번호: CASE-001/);
  assert.doesNotMatch(emailBody("CASE-001"), /accessToken|Bearer|DATABASE_URL/);
});
