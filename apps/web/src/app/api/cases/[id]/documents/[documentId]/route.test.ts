import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { prisma } from "@project/db";

import { createCaseAccessToken } from "@/lib/auth";

import { GET, PATCH } from "./route";

type FindFirst = (args: unknown) => Promise<unknown>;
type UpdateMany = (args: unknown) => Promise<{ count: number }>;

const documentDelegate = prisma.document as unknown as {
  findFirst: FindFirst;
  updateMany: UpdateMany;
};
const originalFindFirst = documentDelegate.findFirst;
const originalUpdateMany = documentDelegate.updateMany;
const originalConsoleError = console.error;
const originalAuthSecret = process.env.AUTH_SECRET;

process.env.AUTH_SECRET =
  "document-detail-route-test-secret-at-least-32-characters";

afterEach(() => {
  documentDelegate.findFirst = originalFindFirst;
  documentDelegate.updateMany = originalUpdateMany;
  console.error = originalConsoleError;
  process.env.AUTH_SECRET =
    originalAuthSecret ??
    "document-detail-route-test-secret-at-least-32-characters";
});

function routeContext(caseId = "case_a", documentId = "document_a") {
  return {
    params: Promise.resolve({ id: caseId, documentId }),
  };
}

function createRequest(
  method: "GET" | "PATCH",
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

  return new Request(
    "http://localhost/api/cases/case_a/documents/document_a",
    {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
}

function storedDocument(
  status: "ANALYZED" | "NEEDS_REVIEW" | "CONFIRMED" = "ANALYZED",
  confirmedAt: Date | null = null,
) {
  const timestamp = new Date("2026-08-10T00:00:00.000Z");

  return {
    id: "document_a",
    caseId: "case_a",
    type: "RECEIPT",
    status,
    analysisSummary: "Receipt analyzed.",
    extractedData: {
      documentTitle: "Receipt",
      issuedAt: "2026-08-10",
    },
    missingFields: [],
    analyzedAt: timestamp,
    confirmedAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

test("GET returns a Document owned by the Case", async () => {
  const token = await createCaseAccessToken("case_a");
  let capturedArgs: unknown;
  documentDelegate.findFirst = async (args) => {
    capturedArgs = args;
    return storedDocument();
  };

  const response = await GET(
    createRequest("GET", token),
    routeContext(),
  );
  const body = await responseJson(response);

  assert.equal(response.status, 200);
  assert.equal(
    (body.data as { document: { id: string } }).document.id,
    "document_a",
  );
  assert.deepEqual(capturedArgs, {
    where: { id: "document_a", caseId: "case_a" },
  });
});

test("GET does not expose a Document owned by another Case", async () => {
  const token = await createCaseAccessToken("case_a");
  documentDelegate.findFirst = async () => null;

  const response = await GET(
    createRequest("GET", token),
    routeContext("case_a", "case_b_document"),
  );

  assert.equal(response.status, 404);
  assert.equal((await responseJson(response)).error, "DOCUMENT_NOT_FOUND");
});

test("GET returns 404 for an unknown documentId", async () => {
  const token = await createCaseAccessToken("case_a");
  documentDelegate.findFirst = async () => null;

  const response = await GET(
    createRequest("GET", token),
    routeContext("case_a", "missing_document"),
  );

  assert.equal(response.status, 404);
  assert.equal((await responseJson(response)).error, "DOCUMENT_NOT_FOUND");
});

for (const initialStatus of ["ANALYZED", "NEEDS_REVIEW"] as const) {
  test(`PATCH confirms a Document from ${initialStatus}`, async () => {
    const token = await createCaseAccessToken("case_a");
    let currentDocument = storedDocument(initialStatus);
    let capturedUpdateArgs: unknown;
    documentDelegate.updateMany = async (args: unknown) => {
      capturedUpdateArgs = args;
      const data = (args as {
        data: { status: "CONFIRMED"; confirmedAt: Date };
      }).data;
      currentDocument = {
        ...currentDocument,
        status: data.status,
        confirmedAt: data.confirmedAt,
      };
      return { count: 1 };
    };
    documentDelegate.findFirst = async () => currentDocument;

    const response = await PATCH(
      createRequest("PATCH", token, { status: "CONFIRMED" }),
      routeContext(),
    );
    const body = await responseJson(response);
    const document = (
      body.data as {
        document: { status: string; confirmedAt: string | null };
      }
    ).document;

    assert.equal(response.status, 200);
    assert.equal(document.status, "CONFIRMED");
    assert.equal(typeof document.confirmedAt, "string");
    assert.deepEqual(
      (capturedUpdateArgs as { where: unknown }).where,
      {
        id: "document_a",
        caseId: "case_a",
        status: { in: ["ANALYZED", "NEEDS_REVIEW"] },
      },
    );
  });
}

test("PATCH is idempotent for an already CONFIRMED Document", async () => {
  const token = await createCaseAccessToken("case_a");
  const originalConfirmedAt = new Date("2026-08-10T01:00:00.000Z");
  documentDelegate.updateMany = async () => ({ count: 0 });
  documentDelegate.findFirst = async () =>
    storedDocument("CONFIRMED", originalConfirmedAt);

  const response = await PATCH(
    createRequest("PATCH", token, { status: "CONFIRMED" }),
    routeContext(),
  );
  const body = await responseJson(response);
  const document = (
    body.data as { document: { confirmedAt: string } }
  ).document;

  assert.equal(response.status, 200);
  assert.equal(document.confirmedAt, originalConfirmedAt.toISOString());
});

for (const invalidStatus of ["ANALYZED", "NEEDS_REVIEW"] as const) {
  test(`PATCH rejects status ${invalidStatus}`, async () => {
    const token = await createCaseAccessToken("case_a");
    let updateCalls = 0;
    documentDelegate.updateMany = async () => {
      updateCalls += 1;
      return { count: 0 };
    };

    const response = await PATCH(
      createRequest("PATCH", token, { status: invalidStatus }),
      routeContext(),
    );

    assert.equal(response.status, 400);
    assert.equal((await responseJson(response)).error, "INVALID_INPUT");
    assert.equal(updateCalls, 0);
  });
}

test("PATCH rejects an unknown field", async () => {
  const token = await createCaseAccessToken("case_a");
  let updateCalls = 0;
  documentDelegate.updateMany = async () => {
    updateCalls += 1;
    return { count: 0 };
  };

  const response = await PATCH(
    createRequest("PATCH", token, {
      status: "CONFIRMED",
      analysisSummary: "tampered",
    }),
    routeContext(),
  );

  assert.equal(response.status, 400);
  assert.equal((await responseJson(response)).error, "INVALID_INPUT");
  assert.equal(updateCalls, 0);
});

test("PATCH without a token returns 401", async () => {
  let updateCalls = 0;
  documentDelegate.updateMany = async () => {
    updateCalls += 1;
    return { count: 0 };
  };

  const response = await PATCH(
    createRequest("PATCH", undefined, { status: "CONFIRMED" }),
    routeContext(),
  );

  assert.equal(response.status, 401);
  assert.equal((await responseJson(response)).error, "AUTHENTICATION_REQUIRED");
  assert.equal(updateCalls, 0);
});

test("GET with an invalid token returns 401", async () => {
  let findCalls = 0;
  documentDelegate.findFirst = async () => {
    findCalls += 1;
    return null;
  };

  const response = await GET(
    createRequest("GET", "invalid-token"),
    routeContext(),
  );

  assert.equal(response.status, 401);
  assert.equal((await responseJson(response)).error, "INVALID_ACCESS_TOKEN");
  assert.equal(findCalls, 0);
});

test("Case A token cannot PATCH a Case B Document", async () => {
  const token = await createCaseAccessToken("case_a");
  let updateCalls = 0;
  documentDelegate.updateMany = async () => {
    updateCalls += 1;
    return { count: 0 };
  };

  const response = await PATCH(
    createRequest("PATCH", token, { status: "CONFIRMED" }),
    routeContext("case_b", "document_b"),
  );

  assert.equal(response.status, 403);
  assert.equal((await responseJson(response)).error, "FORBIDDEN");
  assert.equal(updateCalls, 0);
});

test("PATCH returns 500 when the database update fails", async () => {
  console.error = () => undefined;
  const token = await createCaseAccessToken("case_a");
  documentDelegate.updateMany = async () => {
    throw new Error("database error");
  };

  const response = await PATCH(
    createRequest("PATCH", token, { status: "CONFIRMED" }),
    routeContext(),
  );

  assert.equal(response.status, 500);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INTERNAL_SERVER_ERROR",
  });
});
