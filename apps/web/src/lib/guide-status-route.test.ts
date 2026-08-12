import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { prisma } from "@project/db";

import { createCaseAccessToken } from "@/lib/auth";
import { PATCH } from "@/app/api/cases/[id]/guides/[guideId]/route";

process.env.AUTH_SECRET = "guide-route-test-secret";

const guideStep = prisma.guideStep as unknown as {
  findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
  update: (args: unknown) => Promise<Record<string, unknown>>;
};
const originalFindFirst = guideStep.findFirst;
const originalUpdate = guideStep.update;

afterEach(() => {
  guideStep.findFirst = originalFindFirst;
  guideStep.update = originalUpdate;
});

function request(token: string | undefined, status: string) {
  return new Request("http://localhost/api/cases/case-a/guides/guide-a", {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
  });
}

function context(caseId = "case-a", guideId = "guide-a") {
  return { params: Promise.resolve({ id: caseId, guideId }) };
}

test("PATCH stores a completed guide only within the authorized case", async () => {
  const token = await createCaseAccessToken("case-a");
  const originalGuide = {
    id: "guide-a",
    caseId: "case-a",
    status: "PENDING",
    completedAt: null,
  };
  let findArgs: unknown;
  let updateArgs: unknown;
  guideStep.findFirst = async (args) => {
    findArgs = args;
    return originalGuide;
  };
  guideStep.update = async (args) => {
    updateArgs = args;
    return { ...originalGuide, status: "COMPLETED", completedAt: new Date() };
  };

  const response = await PATCH(request(token, "COMPLETED"), context());
  const body = await response.json() as { success: boolean };

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(findArgs, { where: { id: "guide-a", caseId: "case-a" } });
  assert.equal(
    (updateArgs as { data: { status: string } }).data.status,
    "COMPLETED",
  );
});

test("PATCH rejects a token for another case before reading a guide", async () => {
  const token = await createCaseAccessToken("case-b");
  let wasRead = false;
  guideStep.findFirst = async () => {
    wasRead = true;
    return null;
  };

  const response = await PATCH(request(token, "COMPLETED"), context());

  assert.equal(response.status, 403);
  assert.deepEqual(await response.json(), { success: false, error: "FORBIDDEN" });
  assert.equal(wasRead, false);
});

test("PATCH rejects an unsupported guide status", async () => {
  const token = await createCaseAccessToken("case-a");
  const response = await PATCH(request(token, "INVALID"), context());

  assert.equal(response.status, 400);
  assert.equal((await response.json() as { error: string }).error, "INVALID_INPUT");
});
