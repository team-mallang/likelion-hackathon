import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";

import { prisma } from "@project/db";

import {
  hashPassword,
  verifyCaseAccessToken,
} from "@/lib/auth";

import { POST } from "./route";

type FindUnique = (args: unknown) => Promise<unknown>;

const caseDelegate = prisma.case as unknown as {
  findUnique: FindUnique;
};

const originalFindUnique = caseDelegate.findUnique;
const originalConsoleError = console.error;
const originalAuthSecret = process.env.AUTH_SECRET;

const testAuthSecret = "case-auth-route-test-secret-at-least-32-characters";

beforeEach(() => {
  process.env.AUTH_SECRET = testAuthSecret;
});

afterEach(() => {
  caseDelegate.findUnique = originalFindUnique;
  console.error = originalConsoleError;

  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalAuthSecret;
  }
});

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/cases/auth", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createInvalidJsonRequest() {
  return new Request("http://localhost/api/cases/auth", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "{",
  });
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

async function storedCase(password = "correct-password") {
  return {
    id: "case_a",
    caseNumber: "KR2026AB12",
    passwordHash: await hashPassword(password),
    status: "CONFIRMED",
  };
}

test("POST authenticates a Case and returns a case-access JWT", async () => {
  caseDelegate.findUnique = async () => storedCase();

  const response = await POST(
    createJsonRequest({
      caseNumber: "KR2026AB12",
      password: "correct-password",
    }),
  );
  const body = await responseJson(response);
  const data = body.data as {
    caseId: string;
    caseNumber: string;
    status: string;
    accessToken: string;
    passwordHash?: string;
  };

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(data.caseId, "case_a");
  assert.equal(data.caseNumber, "KR2026AB12");
  assert.equal(data.status, "CONFIRMED");
  assert.equal(typeof data.accessToken, "string");
  assert.equal("passwordHash" in data, false);
  assert.deepEqual(await verifyCaseAccessToken(data.accessToken), {
    caseId: "case_a",
  });
});

test("POST rejects an incorrect password without exposing the Case", async () => {
  caseDelegate.findUnique = async () => storedCase();

  const response = await POST(
    createJsonRequest({
      caseNumber: "KR2026AB12",
      password: "incorrect-password",
    }),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INVALID_CREDENTIALS",
  });
});

test("POST uses the same response for an unknown caseNumber", async () => {
  caseDelegate.findUnique = async () => null;

  const response = await POST(
    createJsonRequest({
      caseNumber: "KR2026ZZZZ",
      password: "correct-password",
    }),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INVALID_CREDENTIALS",
  });
});

test("POST rejects a Case without a stored passwordHash", async () => {
  caseDelegate.findUnique = async () => ({
    id: "case_a",
    caseNumber: "KR2026AB12",
    passwordHash: null,
    status: "CONFIRMED",
  });

  const response = await POST(
    createJsonRequest({
      caseNumber: "KR2026AB12",
      password: "correct-password",
    }),
  );

  assert.equal(response.status, 401);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INVALID_CREDENTIALS",
  });
});

test("POST rejects malformed JSON", async () => {
  const response = await POST(createInvalidJsonRequest());

  assert.equal(response.status, 400);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INVALID_JSON",
  });
});

test("POST rejects an invalid authentication request before querying", async () => {
  let findCalls = 0;
  caseDelegate.findUnique = async () => {
    findCalls += 1;
    return null;
  };

  const response = await POST(
    createJsonRequest({
      caseNumber: "KR2026AB12",
    }),
  );
  const body = await responseJson(response);

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error, "INVALID_INPUT");
  assert.equal(typeof body.details, "object");
  assert.equal(findCalls, 0);
});

test("POST returns a safe 500 response when the database lookup fails", async () => {
  console.error = () => undefined;
  caseDelegate.findUnique = async () => {
    throw new Error("database error");
  };

  const response = await POST(
    createJsonRequest({
      caseNumber: "KR2026AB12",
      password: "correct-password",
    }),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
});
