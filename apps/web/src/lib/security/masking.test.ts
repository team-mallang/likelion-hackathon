import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  maskDocumentNumber,
  maskEmail,
  maskPassportNumber,
  maskPhoneNumber,
  maskString,
} from "./masking.ts";

describe("personal data masking", () => {
  test("masks passport numbers", () => {
    assert.equal(maskPassportNumber("M12345678"), "M*****678");
  });

  test("masks phone numbers while retaining separators", () => {
    assert.equal(maskPhoneNumber("010-1234-5678"), "010-****-5678");
  });

  test("masks email local parts", () => {
    assert.equal(maskEmail("minji@example.com"), "m****@example.com");
  });

  test("masks insurance policy and document numbers", () => {
    assert.equal(maskDocumentNumber("AB-123456-7890"), "AB-******-7890");
  });

  test("handles empty and malformed values without exposing them", () => {
    assert.equal(maskPassportNumber(undefined), "");
    assert.equal(maskPhoneNumber("---"), "");
    assert.equal(maskEmail("invalid-email"), "i************");
    assert.equal(maskString("A"), "*");
  });
});
