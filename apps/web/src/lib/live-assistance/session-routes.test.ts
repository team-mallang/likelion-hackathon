import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createCaseAccessToken } from "@/lib/auth";

import { POST as createSession } from "@/app/api/cases/[id]/live-assistance/session/route";
import { POST as processContext } from "@/app/api/cases/[id]/live-assistance/session/[sessionId]/context/route";
import { DELETE as closeSession } from "@/app/api/cases/[id]/live-assistance/session/[sessionId]/route";

const originalAuthSecret = process.env.AUTH_SECRET;

afterEach(() => {
  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalAuthSecret;
  }
});

test("live-assistance session endpoints require a Case access token", async () => {
  const sessionResponse = await createSession(
    new Request("http://localhost/api/cases/case_1/live-assistance/session", { method: "POST" }),
    { params: Promise.resolve({ id: "case_1" }) },
  );
  const contextResponse = await processContext(
    new Request("http://localhost/api/cases/case_1/live-assistance/session/session_1/context", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ statement: "지갑 색상은 무엇인가요?" }),
    }),
    { params: Promise.resolve({ id: "case_1", sessionId: "session_1" }) },
  );
  const closeResponse = await closeSession(
    new Request("http://localhost/api/cases/case_1/live-assistance/session/session_1", { method: "DELETE" }),
    { params: Promise.resolve({ id: "case_1", sessionId: "session_1" }) },
  );

  for (const response of [sessionResponse, contextResponse, closeResponse]) {
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error, "AUTHENTICATION_REQUIRED");
  }
});

test("live-assistance session endpoints reject a token for another Case", async () => {
  process.env.AUTH_SECRET = "test-live-assistance-auth-secret";
  const otherCaseToken = await createCaseAccessToken("case_other");
  const sessionResponse = await createSession(
    new Request("http://localhost/api/cases/case_1/live-assistance/session", {
      method: "POST",
      headers: { authorization: `Bearer ${otherCaseToken}` },
    }),
    { params: Promise.resolve({ id: "case_1" }) },
  );
  const contextResponse = await processContext(
    new Request("http://localhost/api/cases/case_1/live-assistance/session/session_1/context", {
      method: "POST",
      headers: { authorization: `Bearer ${otherCaseToken}`, "content-type": "application/json" },
      body: JSON.stringify({ statement: "지갑 색상은 무엇인가요?" }),
    }),
    { params: Promise.resolve({ id: "case_1", sessionId: "session_1" }) },
  );
  const closeResponse = await closeSession(
    new Request("http://localhost/api/cases/case_1/live-assistance/session/session_1", {
      method: "DELETE",
      headers: { authorization: `Bearer ${otherCaseToken}` },
    }),
    { params: Promise.resolve({ id: "case_1", sessionId: "session_1" }) },
  );

  for (const response of [sessionResponse, contextResponse, closeResponse]) {
    assert.equal(response.status, 403);
    assert.equal((await response.json()).error, "FORBIDDEN");
  }
});
