import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { prisma } from "@project/db";
import { createConfirmedCaseSuccessResponseSchema } from "@project/shared";

import { verifyPassword } from "@/lib/auth";

import { POST } from "./route";

type TransactionCallback = (tx: {
  case: {
    create: (args: unknown) => Promise<unknown>;
  };
}) => Promise<unknown>;

type TransactionMethod = (callback: TransactionCallback) => Promise<unknown>;

const prismaWithMockableTransaction = prisma as unknown as {
  $transaction: TransactionMethod;
};
const originalTransaction = prismaWithMockableTransaction.$transaction;
const originalConsoleError = console.error;

afterEach(() => {
  prismaWithMockableTransaction.$transaction = originalTransaction;
  console.error = originalConsoleError;
});

function createRequest(body: unknown) {
  return new Request("http://localhost/api/cases", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createInvalidJsonRequest() {
  return new Request("http://localhost/api/cases", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "{",
  });
}

function createInput(
  type: "LOST" | "STOLEN" | "UNKNOWN",
  items: Array<Record<string, unknown> & { name: string }> = [
    { name: "wallet" },
  ],
) {
  return {
    initialStatement: "I cannot find my belongings.",
    countryCode: "KR",
    type,
    password: "password123",
    items,
  };
}

function createStoredCase(args: unknown) {
  const data = (args as {
    data: Record<string, unknown> & {
      items: { create: Array<Record<string, unknown>> };
    };
  }).data;
  const now = new Date("2026-08-09T00:00:00.000Z");
  const caseId = "case_1";

  return {
    id: caseId,
    caseNumber: data.caseNumber,
    type: data.type,
    status: data.status,
    countryCode: data.countryCode,
    initialStatement: data.initialStatement,
    lastSeenAt: data.lastSeenAt ?? null,
    lastSeenPlace: data.lastSeenPlace ?? null,
    discoveredAt: data.discoveredAt ?? null,
    discoveredPlace: data.discoveredPlace ?? null,
    estimatedOccurredAt: data.estimatedOccurredAt ?? null,
    estimatedOccurredPlace: data.estimatedOccurredPlace ?? null,
    routeAfterLastSeen: data.routeAfterLastSeen ?? null,
    storageState: data.storageState ?? null,
    description: data.description ?? null,
    aiSummary: data.aiSummary ?? null,
    missingFields: data.missingFields ?? null,
    retentionUntil: null,
    createdAt: now,
    updatedAt: now,
    items: data.items.create.map((item, index) => ({
      id: `item_${index + 1}`,
      caseId,
      name: item.name,
      category: item.category ?? null,
      quantity: item.quantity,
      brand: item.brand ?? null,
      model: item.model ?? null,
      color: item.color ?? null,
      description: item.description ?? null,
      identifyingFeature: item.identifyingFeature ?? null,
      unauthorizedTransactionOccurred:
        item.unauthorizedTransactionOccurred ?? null,
      phoneCaseDescription: item.phoneCaseDescription ?? null,
      findMyDeviceAvailable: item.findMyDeviceAvailable ?? null,
      shape: item.shape ?? null,
      contentsDescription: item.contentsDescription ?? null,
      passportDocumentType: item.passportDocumentType ?? null,
      passportNumberKnown: item.passportNumberKnown ?? null,
      departureAt: item.departureAt ?? null,
      cashAmount: item.cashAmount ?? null,
      currency: item.currency ?? null,
      lastSeenAt: item.lastSeenAt ?? null,
      lastSeenPlace: item.lastSeenPlace ?? null,
      createdAt: now,
      updatedAt: now,
    })),
  };
}

function mockSuccessfulTransaction(
  capturedCreateArgs: unknown[] = [],
) {
  let transactionCalls = 0;

  prismaWithMockableTransaction.$transaction = async (callback) => {
    transactionCalls += 1;
    const tx = {
      case: {
        create: async (args: unknown) => {
          capturedCreateArgs.push(args);
          return createStoredCase(args);
        },
      },
    };

    return callback(tx);
  };

  return () => transactionCalls;
}

async function readJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

for (const type of ["LOST", "STOLEN", "UNKNOWN"] as const) {
  test(`POST saves a ${type} case as CONFIRMED`, async () => {
    const capturedCreateArgs: unknown[] = [];
    mockSuccessfulTransaction(capturedCreateArgs);

    const response = await POST(createRequest(createInput(type)));
    const body = await readJson(response);
    const caseData = (body.data as { case: Record<string, unknown> }).case;

    assert.equal(response.status, 201);
    assert.equal(body.success, true);
    assert.equal(caseData.type, type);
    assert.equal(caseData.status, "CONFIRMED");
    assert.equal((caseData.items as unknown[]).length, 1);

    const createData = (capturedCreateArgs[0] as {
      data: Record<string, unknown>;
    }).data;
    assert.equal(createData.status, "CONFIRMED");
  });
}

test("POST saves every supplied CaseItem", async () => {
  mockSuccessfulTransaction();
  const items = [
    { name: "backpack" },
    { name: "wallet" },
    { name: "passport" },
  ];

  const response = await POST(
    createRequest(createInput("LOST", items)),
  );
  const body = await readJson(response);
  const storedItems = (
    body.data as { case: { items: Array<{ name: string }> } }
  ).case.items;

  assert.equal(response.status, 201);
  assert.deepEqual(
    storedItems.map((item) => item.name),
    items.map((item) => item.name),
  );
});

test("POST creates deterministic guide steps with the confirmed case", async () => {
  const capturedCreateArgs: unknown[] = [];
  mockSuccessfulTransaction(capturedCreateArgs);

  const response = await POST(
    createRequest(
      createInput("STOLEN", [
        { name: "card", category: "CARD" },
        { name: "phone", category: "PHONE" },
      ]),
    ),
  );

  assert.equal(response.status, 201);
  const createData = (capturedCreateArgs[0] as {
    data: {
      guideSteps: { create: Array<{ priority: number; stepOrder: number }> };
    };
  }).data;

  assert.deepEqual(
    createData.guideSteps.create.map((step) => step.priority),
    [100, 95, 90, 50],
  );
  assert.deepEqual(
    createData.guideSteps.create.map((step) => step.stepOrder),
    [1, 2, 3, 4],
  );
});

test("POST maps S05 editable fields to existing Case and CaseItem fields", async () => {
  const capturedCreateArgs: unknown[] = [];
  mockSuccessfulTransaction(capturedCreateArgs);
  const input = {
    ...createInput("STOLEN", [
      {
        name: "passport",
        category: "IDENTITY_DOCUMENT",
        quantity: 1,
        brand: "Republic of Korea",
        model: "electronic passport",
        color: "navy",
        description: "Passport kept inside the front pocket",
        identifyingFeature: "Blue protective cover",
        passportDocumentType: "ORIGINAL",
        passportNumberKnown: true,
        departureAt: "2026-08-12T09:00:00.000Z",
        lastSeenAt: "2026-08-09T12:00:00.000Z",
        lastSeenPlace: "Seoul Station",
      },
    ]),
    lastSeenAt: "2026-08-09T12:00:00.000Z",
    lastSeenPlace: "Seoul Station",
    discoveredAt: "2026-08-09T12:30:00.000Z",
    discoveredPlace: "City Hall Station",
    estimatedOccurredAt: "2026-08-09T12:15:00.000Z",
    estimatedOccurredPlace: "Train carriage",
    routeAfterLastSeen: "Seoul Station to City Hall Station",
    storageState: "Inside the front pocket of a backpack",
    description: "Additional clue: the front pocket zipper was open.",
    aiSummary: "A passport was stolen while traveling by train.",
    missingFields: [],
  };

  const response = await POST(createRequest(input));
  const body = await readJson(response);
  const storedCase = (body.data as { case: Record<string, unknown> }).case;
  const storedItem = (storedCase.items as Array<Record<string, unknown>>)[0];

  assert.equal(response.status, 201);
  assert.equal(storedCase.type, input.type);
  assert.equal(storedCase.lastSeenPlace, input.lastSeenPlace);
  assert.equal(storedCase.discoveredPlace, input.discoveredPlace);
  assert.equal(storedCase.estimatedOccurredPlace, input.estimatedOccurredPlace);
  assert.equal(storedCase.routeAfterLastSeen, input.routeAfterLastSeen);
  assert.equal(storedCase.storageState, input.storageState);
  assert.equal(storedCase.description, input.description);
  assert.equal(storedCase.aiSummary, input.aiSummary);
  assert.equal(storedItem?.name, input.items[0]?.name);
  assert.equal(storedItem?.category, input.items[0]?.category);
  assert.equal(
    storedItem?.passportDocumentType,
    input.items[0]?.passportDocumentType,
  );
  assert.equal(
    storedItem?.identifyingFeature,
    input.items[0]?.identifyingFeature,
  );

  const createData = (capturedCreateArgs[0] as {
    data: Record<string, unknown> & {
      items: { create: Array<Record<string, unknown>> };
    };
  }).data;
  assert.equal(createData.description, input.description);
  assert.equal(
    createData.items.create[0]?.description,
    input.items[0]?.description,
  );
});

test("POST rejects an empty items array before starting a transaction", async () => {
  let transactionCalls = 0;
  prismaWithMockableTransaction.$transaction = async () => {
    transactionCalls += 1;
    throw new Error("Transaction must not run.");
  };

  const response = await POST(
    createRequest(createInput("LOST", [])),
  );
  const body = await readJson(response);

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error, "INVALID_INPUT");
  assert.equal(transactionCalls, 0);
});

test("POST stores only a bcrypt passwordHash", async () => {
  const capturedCreateArgs: unknown[] = [];
  mockSuccessfulTransaction(capturedCreateArgs);
  const input = createInput("LOST");

  const response = await POST(createRequest(input));
  const createData = (capturedCreateArgs[0] as {
    data: Record<string, unknown>;
  }).data;
  const passwordHash = createData.passwordHash;

  assert.equal(response.status, 201);
  assert.equal("password" in createData, false);
  assert.equal(typeof passwordHash, "string");
  assert.notEqual(passwordHash, input.password);
  assert.equal(
    await verifyPassword(input.password, passwordHash as string),
    true,
  );
});

test("POST follows the database error path when a transaction fails", async () => {
  console.error = () => undefined;
  let transactionCalls = 0;
  let createCalls = 0;
  prismaWithMockableTransaction.$transaction = async (callback) => {
    transactionCalls += 1;
    const tx = {
      case: {
        create: async () => {
          createCalls += 1;
          throw new Error("CaseItem creation failed.");
        },
      },
    };

    return callback(tx);
  };

  const response = await POST(createRequest(createInput("LOST")));
  const body = await readJson(response);

  assert.equal(transactionCalls, 1);
  assert.equal(createCalls, 1);
  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
});

test("POST retries a caseNumber P2002 conflict in a new transaction", async () => {
  const transactionClients: object[] = [];
  let transactionCalls = 0;

  prismaWithMockableTransaction.$transaction = async (callback) => {
    transactionCalls += 1;
    const tx = {
      case: {
        create: async (args: unknown) => {
          if (transactionCalls === 1) {
            throw {
              code: "P2002",
              meta: { target: ["caseNumber"] },
            };
          }

          return createStoredCase(args);
        },
      },
    };
    transactionClients.push(tx);

    return callback(tx);
  };

  const response = await POST(createRequest(createInput("LOST")));

  assert.equal(response.status, 201);
  assert.equal(transactionCalls, 2);
  assert.equal(transactionClients.length, 2);
  assert.notEqual(transactionClients[0], transactionClients[1]);
});

test("POST retries a string caseNumber P2002 target", async () => {
  let transactionCalls = 0;

  prismaWithMockableTransaction.$transaction = async (callback) => {
    transactionCalls += 1;
    const tx = {
      case: {
        create: async (args: unknown) => {
          if (transactionCalls === 1) {
            throw {
              code: "P2002",
              meta: { target: "caseNumber" },
            };
          }

          return createStoredCase(args);
        },
      },
    };

    return callback(tx);
  };

  const response = await POST(createRequest(createInput("LOST")));

  assert.equal(response.status, 201);
  assert.equal(transactionCalls, 2);
});

test("POST does not retry a similar caseNumber target", async () => {
  console.error = () => undefined;
  let transactionCalls = 0;
  prismaWithMockableTransaction.$transaction = async () => {
    transactionCalls += 1;
    throw {
      code: "P2002",
      meta: { target: "previousCaseNumber" },
    };
  };

  const response = await POST(createRequest(createInput("LOST")));
  const body = await readJson(response);

  assert.equal(transactionCalls, 1);
  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
});

test("POST stops after ten caseNumber conflicts", async () => {
  console.error = () => undefined;
  let transactionCalls = 0;
  prismaWithMockableTransaction.$transaction = async () => {
    transactionCalls += 1;
    throw {
      code: "P2002",
      meta: { target: ["caseNumber"] },
    };
  };

  const response = await POST(createRequest(createInput("LOST")));
  const body = await readJson(response);

  assert.equal(transactionCalls, 10);
  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
});

test("POST does not retry a P2002 conflict for another field", async () => {
  console.error = () => undefined;
  let transactionCalls = 0;
  prismaWithMockableTransaction.$transaction = async () => {
    transactionCalls += 1;
    throw {
      code: "P2002",
      meta: { target: ["email"] },
    };
  };

  const response = await POST(createRequest(createInput("LOST")));
  const body = await readJson(response);

  assert.equal(transactionCalls, 1);
  assert.equal(response.status, 500);
  assert.deepEqual(body, {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
});

test("POST success response matches the shared schema", async () => {
  mockSuccessfulTransaction();

  const response = await POST(createRequest(createInput("UNKNOWN")));
  const body = await response.json();

  assert.equal(response.status, 201);
  assert.equal(
    createConfirmedCaseSuccessResponseSchema.safeParse(body).success,
    true,
  );
});

test("POST preserves the invalid JSON error response", async () => {
  const response = await POST(createInvalidJsonRequest());

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), {
    success: false,
    error: "INVALID_JSON",
  });
});
