import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { caseAnalysisResultSchema } from "@project/shared";

import { POST } from "./route";

const originalAIMockMode = process.env.AI_MOCK_MODE;
const originalOpenAIAPIKey = process.env.OPENAI_API_KEY;

afterEach(() => {
  restoreEnvironmentVariable("AI_MOCK_MODE", originalAIMockMode);
  restoreEnvironmentVariable("OPENAI_API_KEY", originalOpenAIAPIKey);
});

function restoreEnvironmentVariable(
  name: "AI_MOCK_MODE" | "OPENAI_API_KEY",
  value: string | undefined,
) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function createJsonRequest(body: unknown) {
  return new Request("http://localhost/api/cases/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

function createInvalidJsonRequest() {
  return new Request("http://localhost/api/cases/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: "{",
  });
}

function createCompleteInput() {
  return {
    initialStatement: "I lost my backpack while traveling.",
    countryCode: "KR",
    type: "LOST",
    lastSeenAt: "2026-08-09T12:00:00.000Z",
    lastSeenPlace: "Seoul Station",
    discoveredAt: "2026-08-09T12:30:00.000Z",
    discoveredPlace: "City Hall Station",
    description: "The backpack was left near the platform.",
    items: [
      {
        name: "Backpack",
        category: "BAG",
        quantity: 1,
        brand: "Travel Pack",
        model: "TP-01",
        color: "black",
        description: "Medium-sized backpack",
        identifyingFeature: "Orange key ring",
        lastSeenAt: "2026-08-09T12:00:00.000Z",
        lastSeenPlace: "Seoul Station",
      },
    ],
  };
}

async function responseJson(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

test("POST returns a schema-valid Mock analysis", async () => {
  process.env.AI_MOCK_MODE = "true";

  const response = await POST(createJsonRequest(createCompleteInput()));
  const body = await responseJson(response);
  const data = body.data;

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(body.meta, {
    provider: "mock",
    model: null,
  });
  assert.equal(caseAnalysisResultSchema.safeParse(data).success, true);

  const result = data as {
    missingFields: string[];
    questions: unknown[];
    items: Array<Record<string, unknown>>;
  };

  assert.deepEqual(result.missingFields, []);
  assert.deepEqual(result.questions, []);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.name, "Backpack");
  assert.equal(result.items[0]?.identifyingFeature, "Orange key ring");
});

test("POST returns missing fields and follow-up questions for incomplete input", async () => {
  process.env.AI_MOCK_MODE = "true";

  const response = await POST(
    createJsonRequest({
      initialStatement: "I cannot find my bag.",
      countryCode: "KR",
      type: "LOST",
      items: [],
    }),
  );
  const body = await responseJson(response);
  const data = body.data as {
    missingFields: string[];
    questions: Array<{ field: string; question: string }>;
    items: unknown[];
  };

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(data.missingFields, [
    "lastSeenAt",
    "lastSeenPlace",
    "discoveredAt",
    "discoveredPlace",
    "items",
  ]);
  assert.deepEqual(
    data.questions.map((question) => question.field),
    data.missingFields,
  );
  assert.deepEqual(data.items, []);
});

test("POST rejects malformed JSON", async () => {
  process.env.AI_MOCK_MODE = "true";

  const response = await POST(createInvalidJsonRequest());

  assert.equal(response.status, 400);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "INVALID_JSON",
  });
});

test("POST rejects an invalid request before calling an AI provider", async () => {
  process.env.AI_MOCK_MODE = "false";
  process.env.OPENAI_API_KEY = "must-not-be-used";

  const response = await POST(
    createJsonRequest({
      initialStatement: "I lost my bag.",
      countryCode: "kr",
      items: [],
    }),
  );
  const body = await responseJson(response);

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error, "INVALID_INPUT");
  assert.equal(typeof body.details, "object");
});

test("POST returns 503 when OpenAI mode has no API key", async () => {
  process.env.AI_MOCK_MODE = "false";
  delete process.env.OPENAI_API_KEY;

  const response = await POST(createJsonRequest(createCompleteInput()));

  assert.equal(response.status, 503);
  assert.deepEqual(await responseJson(response), {
    success: false,
    error: "AI_PROVIDER_NOT_CONFIGURED",
  });
});
