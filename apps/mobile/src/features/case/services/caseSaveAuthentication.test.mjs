import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateSavedCase,
  saveCaseIfNeeded,
} from "./caseSaveAuthentication.ts";

test("an authentication failure after saving does not create a second case", async () => {
  let createCalls = 0;
  let authenticateCalls = 0;
  const createCase = async () => {
    createCalls += 1;
    return {
      data: {
        caseId: "case_1",
        case: { caseNumber: "KR-20260811-0001" },
      },
    };
  };
  const authenticateCase = async () => {
    authenticateCalls += 1;
    throw new Error("Authentication temporarily failed");
  };

  const savedCase = await saveCaseIfNeeded(null, createCase);
  await assert.rejects(() =>
    authenticateSavedCase(savedCase, "password123", authenticateCase),
  );

  const retriedSavedCase = await saveCaseIfNeeded(savedCase, createCase);

  assert.equal(retriedSavedCase, savedCase);
  assert.equal(createCalls, 1);
  assert.equal(authenticateCalls, 1);
});

test("authentication retry uses the existing case number without creating a case", async () => {
  let createCalls = 0;
  const savedCase = {
    caseId: "case_1",
    caseNumber: "KR-20260811-0001",
  };
  const createCase = async () => {
    createCalls += 1;
    throw new Error("Creation must not run during authentication retry");
  };
  const authenticateInputs = [];
  const authenticateCase = async (input) => {
    authenticateInputs.push(input);
    return { accessToken: "access-token" };
  };

  const retriedSavedCase = await saveCaseIfNeeded(savedCase, createCase);
  const authenticatedCase = await authenticateSavedCase(
    retriedSavedCase,
    "password123",
    authenticateCase,
  );

  assert.equal(createCalls, 0);
  assert.deepEqual(authenticateInputs, [
    { caseNumber: "KR-20260811-0001", password: "password123" },
  ]);
  assert.equal(authenticatedCase.accessToken, "access-token");
});
