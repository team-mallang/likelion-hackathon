import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { prisma } from "@project/db";

import { createCaseAccessToken } from "@/lib/auth";

import { PATCH } from "./route";

const prismaCase = prisma.case as unknown as {
  findUnique: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
};
const originalFindUnique = prismaCase.findUnique;
const originalUpdate = prismaCase.update;
const originalAuthSecret = process.env.AUTH_SECRET;

afterEach(() => {
  prismaCase.findUnique = originalFindUnique;
  prismaCase.update = originalUpdate;

  if (originalAuthSecret === undefined) {
    delete process.env.AUTH_SECRET;
  } else {
    process.env.AUTH_SECRET = originalAuthSecret;
  }
});

test("PATCH includes all new common incident fields in Prisma update data", async () => {
  process.env.AUTH_SECRET = "test-auth-secret-for-case-patch";
  const accessToken = await createCaseAccessToken("case_1");
  let updateArgs: unknown;

  prismaCase.findUnique = async () => ({ id: "case_1" });
  prismaCase.update = async (args) => {
    updateArgs = args;
    return {
      id: "case_1",
      passwordHash: "hashed-password",
      items: [],
      guideSteps: [],
    };
  };

  const response = await PATCH(
    new Request("http://localhost/api/cases/case_1", {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        estimatedOccurredAt: "2026-08-11T12:00:00.000Z",
        estimatedOccurredPlace: "Train carriage",
        routeAfterLastSeen: "Station to hotel",
        storageState: "Inside a backpack front pocket",
      }),
    }),
    { params: Promise.resolve({ id: "case_1" }) },
  );

  assert.equal(response.status, 200);
  const data = (updateArgs as { data: Record<string, unknown> }).data;
  assert.deepEqual(data.estimatedOccurredAt, new Date("2026-08-11T12:00:00.000Z"));
  assert.equal(data.estimatedOccurredPlace, "Train carriage");
  assert.equal(data.routeAfterLastSeen, "Station to hotel");
  assert.equal(data.storageState, "Inside a backpack front pocket");
});

test("PATCH sanitizes every persisted free-text field", async () => {
  process.env.AUTH_SECRET = "test-auth-secret-for-case-patch";
  const accessToken = await createCaseAccessToken("case_1");
  let updateArgs: unknown;
  prismaCase.findUnique = async () => ({ id: "case_1" });
  prismaCase.update = async (args) => {
    updateArgs = args;
    return { id: "case_1", passwordHash: "hashed-password", items: [], guideSteps: [] };
  };
  const pii = "제 이름은 박지민이고 전화번호는 010-1234-5678입니다.";
  const response = await PATCH(new Request("http://localhost/api/cases/case_1", {
    method: "PATCH",
    headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
    body: JSON.stringify({ routeAfterLastSeen: pii, storageState: pii, description: pii, aiSummary: pii }),
  }), { params: Promise.resolve({ id: "case_1" }) });
  assert.equal(response.status, 200);
  const data = (updateArgs as { data: Record<string, unknown> }).data;
  const expected = "제 이름은 [NAME]이고 전화번호는 [PHONE_NUMBER]입니다.";
  assert.equal(data.routeAfterLastSeen, expected);
  assert.equal(data.storageState, expected);
  assert.equal(data.description, expected);
  assert.equal(data.aiSummary, expected);
  assert.equal(JSON.stringify(data).includes("박지민"), false);
  assert.equal(JSON.stringify(data).includes("010-1234-5678"), false);
});
