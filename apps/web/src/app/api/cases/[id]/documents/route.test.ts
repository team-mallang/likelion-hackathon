import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { prisma } from "@project/db";

import { createCaseAccessToken } from "@/lib/auth";

import { GET, POST } from "./route";

type DocumentCreate = (args: unknown) => Promise<unknown>;
type DocumentFindMany = (args: unknown) => Promise<unknown[]>;

const documentDelegate = prisma.document as unknown as {
  create: DocumentCreate;
  findMany: DocumentFindMany;
};
const originalCreate = documentDelegate.create;
const originalFindMany = documentDelegate.findMany;
const originalConsoleError = console.error;
const originalAuthSecret = process.env.AUTH_SECRET;

process.env.AUTH_SECRET = "document-route-test-secret-at-least-32-characters";

afterEach(() => {
  documentDelegate.create = originalCreate;
  documentDelegate.findMany = originalFindMany;
  console.error = originalConsoleError;
  process.env.AUTH_SECRET =
    originalAuthSecret ??
    "document-route-test-secret-at-least-32-characters";
});

function routeContext(caseId: string) {
  return {
    params: Promise.resolve({ id: caseId }),
  };
}

function createRequest(
  method: "GET" | "POST",
  token?: string,
  body?: unknown,
) {
  const headers = new Headers();

  if (token) {
    headers.set("authorization", `Bearer ${token}`);
  }

  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }

  return new Request("http://localhost/api/cases/case_a/documents", {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

function createDocumentInput(
  status: "ANALYZED" | "NEEDS_REVIEW" = "ANALYZED",
) {
  return {
    type: "RECEIPT",
    status,
    analysisSummary: "Receipt analysis completed.",
    extractedData: {
      documentTitle: "Purchase receipt",
      issuedAt: "2026-08-09",
      amount: 12000,
      currency: "KRW",
      purchaseDate: "2026-08-09T14:30:00.000Z",
    },
    missingFields: [],
  };
}

function createStoredDocument(
  data: Record<string, unknown>,
  id = "document_1",
) {
  const now = new Date("2026-08-10T00:00:00.000Z");

  return {
    id,
    caseId: data.caseId,
    type: data.type,
    status: data.status,
    analysisSummary: data.analysisSummary ?? null,
    extractedData: data.extractedData ?? null,
    missingFields: data.missingFields ?? null,
    analyzedAt: data.analyzedAt ?? null,
    confirmedAt: data.confirmedAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

function mockDocumentCreate(capturedData: Record<string, unknown>[]) {
  documentDelegate.create = async (args: unknown) => {
    const data = (args as { data: Record<string, unknown> }).data;
    capturedData.push(data);
    return createStoredDocument(data);
  };
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

test("POST creates an analyzed Document", async () => {
  const capturedData: Record<string, unknown>[] = [];
  mockDocumentCreate(capturedData);
  const token = await createCaseAccessToken("case_a");

  const response = await POST(
    createRequest("POST", token, createDocumentInput()),
    routeContext("case_a"),
  );
  const body = await responseJson(response);
  const document = (
    body.data as { document: Record<string, unknown> }
  ).document;

  assert.equal(response.status, 201);
  assert.equal(body.success, true);
  assert.equal(document.caseId, "case_a");
  assert.equal(document.status, "ANALYZED");
  assert.equal(capturedData.length, 1);
});

test("GET returns Documents for the requested Case", async () => {
  const token = await createCaseAccessToken("case_a");
  documentDelegate.findMany = async () => [
    createStoredDocument({
      caseId: "case_a",
      type: "RECEIPT",
      status: "ANALYZED",
      analyzedAt: new Date(),
    }),
  ];

  const response = await GET(
    createRequest("GET", token),
    routeContext("case_a"),
  );
  const body = await responseJson(response);
  const documents = (
    body.data as { documents: Array<Record<string, unknown>> }
  ).documents;

  assert.equal(response.status, 200);
  assert.equal(documents.length, 1);
  assert.equal(documents[0]?.caseId, "case_a");
});

test("POST without a token returns 401", async () => {
  let createCalls = 0;
  documentDelegate.create = async () => {
    createCalls += 1;
    throw new Error("must not run");
  };

  const response = await POST(
    createRequest("POST", undefined, createDocumentInput()),
    routeContext("case_a"),
  );

  assert.equal(response.status, 401);
  assert.equal((await responseJson(response)).error, "AUTHENTICATION_REQUIRED");
  assert.equal(createCalls, 0);
});

test("GET with an invalid token returns 401", async () => {
  let findCalls = 0;
  documentDelegate.findMany = async () => {
    findCalls += 1;
    return [];
  };

  const response = await GET(
    createRequest("GET", "invalid-token"),
    routeContext("case_a"),
  );

  assert.equal(response.status, 401);
  assert.equal((await responseJson(response)).error, "INVALID_ACCESS_TOKEN");
  assert.equal(findCalls, 0);
});

test("Case A token cannot POST a Case B Document", async () => {
  const token = await createCaseAccessToken("case_a");
  let createCalls = 0;
  documentDelegate.create = async () => {
    createCalls += 1;
    throw new Error("must not run");
  };

  const response = await POST(
    createRequest("POST", token, createDocumentInput()),
    routeContext("case_b"),
  );

  assert.equal(response.status, 403);
  assert.equal((await responseJson(response)).error, "FORBIDDEN");
  assert.equal(createCalls, 0);
});

test("Case A token cannot GET Case B Documents", async () => {
  const token = await createCaseAccessToken("case_a");
  let findCalls = 0;
  documentDelegate.findMany = async () => {
    findCalls += 1;
    return [];
  };

  const response = await GET(
    createRequest("GET", token),
    routeContext("case_b"),
  );

  assert.equal(response.status, 403);
  assert.equal((await responseJson(response)).error, "FORBIDDEN");
  assert.equal(findCalls, 0);
});

for (const blockedKey of [
  "passportNumber",
  "unexpectedKey",
  "base64",
  "ocrText",
] as const) {
  test(`POST rejects extractedData key ${blockedKey}`, async () => {
    const token = await createCaseAccessToken("case_a");
    let createCalls = 0;
    documentDelegate.create = async () => {
      createCalls += 1;
      throw new Error("must not run");
    };
    const input = createDocumentInput();

    const response = await POST(
      createRequest("POST", token, {
        ...input,
        extractedData: {
          ...input.extractedData,
          [blockedKey]: "blocked value",
        },
      }),
      routeContext("case_a"),
    );

    assert.equal(response.status, 400);
    assert.equal((await responseJson(response)).error, "INVALID_INPUT");
    assert.equal(createCalls, 0);
  });
}

for (const blockedKey of [
  "base64",
  "passportNumber",
  "filePath",
] as const) {
  test(`POST rejects top-level key ${blockedKey}`, async () => {
    const token = await createCaseAccessToken("case_a");
    let createCalls = 0;
    documentDelegate.create = async () => {
      createCalls += 1;
      throw new Error("must not run");
    };

    const response = await POST(
      createRequest("POST", token, {
        ...createDocumentInput(),
        [blockedKey]: "blocked value",
      }),
      routeContext("case_a"),
    );

    assert.equal(response.status, 400);
    assert.equal((await responseJson(response)).error, "INVALID_INPUT");
    assert.equal(createCalls, 0);
  });
}

test("POST rejects CONFIRMED as an initial status", async () => {
  const token = await createCaseAccessToken("case_a");
  let createCalls = 0;
  documentDelegate.create = async () => {
    createCalls += 1;
    throw new Error("must not run");
  };

  const response = await POST(
    createRequest("POST", token, {
      ...createDocumentInput(),
      status: "CONFIRMED",
    }),
    routeContext("case_a"),
  );

  assert.equal(response.status, 400);
  assert.equal((await responseJson(response)).error, "INVALID_INPUT");
  assert.equal(createCalls, 0);
});

test("POST sets analyzedAt on the server and confirmedAt to null", async () => {
  const token = await createCaseAccessToken("case_a");
  const capturedData: Record<string, unknown>[] = [];
  mockDocumentCreate(capturedData);
  const before = Date.now();

  const response = await POST(
    createRequest("POST", token, createDocumentInput()),
    routeContext("case_a"),
  );
  const after = Date.now();
  const analyzedAt = capturedData[0]?.analyzedAt;

  assert.equal(response.status, 201);
  assert.equal(analyzedAt instanceof Date, true);
  assert.equal((analyzedAt as Date).getTime() >= before, true);
  assert.equal((analyzedAt as Date).getTime() <= after, true);
  assert.equal(capturedData[0]?.confirmedAt, null);
});

for (const status of ["ANALYZED", "NEEDS_REVIEW"] as const) {
  test(`POST accepts initial status ${status}`, async () => {
    const token = await createCaseAccessToken("case_a");
    const capturedData: Record<string, unknown>[] = [];
    mockDocumentCreate(capturedData);

    const response = await POST(
      createRequest("POST", token, createDocumentInput(status)),
      routeContext("case_a"),
    );

    assert.equal(response.status, 201);
    assert.equal(capturedData[0]?.status, status);
  });
}

test("POST returns 500 when Document creation fails", async () => {
  console.error = () => undefined;
  const token = await createCaseAccessToken("case_a");
  documentDelegate.create = async () => {
    throw new Error("database error");
  };

  const response = await POST(
    createRequest("POST", token, createDocumentInput()),
    routeContext("case_a"),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
});

test("GET queries only the Case Documents in createdAt descending order", async () => {
  const token = await createCaseAccessToken("case_a");
  let capturedArgs: unknown;
  documentDelegate.findMany = async (args: unknown) => {
    capturedArgs = args;
    return [];
  };

  const response = await GET(
    createRequest("GET", token),
    routeContext("case_a"),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(capturedArgs, {
    where: { caseId: "case_a" },
    orderBy: { createdAt: "desc" },
  });
});
