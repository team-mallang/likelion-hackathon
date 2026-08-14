import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import {
  caseAnalysisResultSchema,
  caseAnalysisSuccessResponseSchema,
} from "@project/shared";

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
    estimatedOccurredAt: "2026-08-09T12:15:00.000Z",
    estimatedOccurredPlace: "Subway platform",
    routeAfterLastSeen: "Seoul Station to City Hall Station",
    storageState: "Inside the luggage rack",
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
        shape: "Backpack",
        contentsDescription: "Clothes and a charger",
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
  assert.equal(
    caseAnalysisSuccessResponseSchema.safeParse(body).success,
    true,
  );
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
    questions: Array<{
      field: string;
      question: string;
      answerType: string;
      options: string[];
      required: boolean;
      order: number;
    }>;
    items: unknown[];
  };

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.deepEqual(data.missingFields, [
    "lastSeenAt",
    "lastSeenPlace",
    "discoveredAt",
    "discoveredPlace",
    "estimatedOccurredAt",
    "estimatedOccurredPlace",
    "routeAfterLastSeen",
    "storageState",
    "description",
    "items[0].name",
  ]);
  assert.deepEqual(
    data.questions.map((question) => question.field),
    data.missingFields,
  );
  assert.deepEqual(
    data.questions.map((question) => question.order),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  );
  assert.equal(data.questions.every((question) => question.required), true);
  assert.equal(
    data.questions.every((question) => Array.isArray(question.options)),
    true,
  );
  assert.deepEqual(data.items, []);
});

test("POST reanalyzes with answers while preserving the initial statement", async () => {
  process.env.AI_MOCK_MODE = "true";
  const initialStatement = "I cannot find my bag after taking the train.";

  const response = await POST(
    createJsonRequest({
      initialStatement,
      countryCode: "KR",
      type: "LOST",
      items: [],
      answers: [
        { field: "lastSeenPlace", value: "Seoul Station" },
      ],
    }),
  );
  const body = await responseJson(response);
  const data = body.data as {
    summary: string;
    missingFields: string[];
    questions: Array<{ field: string }>;
  };

  assert.equal(response.status, 200);
  assert.match(data.summary, /신고가 접수되었습니다/);
  assert.equal(data.summary.includes(initialStatement), false);
  assert.equal(data.missingFields.includes("lastSeenPlace"), false);
  assert.equal(
    data.questions.some((question) => question.field === "lastSeenPlace"),
    false,
  );
});

test("POST applies LOST follow-up question criteria to UNKNOWN", async () => {
  process.env.AI_MOCK_MODE = "true";
  const baseInput = {
    initialStatement: "My bag is missing.",
    countryCode: "KR",
    items: [],
  };

  const [lostResponse, unknownResponse] = await Promise.all([
    POST(createJsonRequest({ ...baseInput, type: "LOST" })),
    POST(createJsonRequest({ ...baseInput, type: "UNKNOWN" })),
  ]);
  const lostBody = await responseJson(lostResponse);
  const unknownBody = await responseJson(unknownResponse);

  assert.deepEqual(
    (unknownBody.data as { questions: unknown[] }).questions,
    (lostBody.data as { questions: unknown[] }).questions,
  );
});

test("POST rejects malformed answers", async () => {
  process.env.AI_MOCK_MODE = "true";

  const response = await POST(
    createJsonRequest({
      initialStatement: "I lost my bag.",
      countryCode: "KR",
      items: [],
      answers: [{ field: "lastSeenPlace", value: { place: "Seoul" } }],
    }),
  );
  const body = await responseJson(response);

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.error, "INVALID_INPUT");
});

test("the AI result schema rejects questions missing UI metadata", () => {
  const result = caseAnalysisResultSchema.safeParse({
    summary: "summary",
    missingFields: ["lastSeenPlace"],
    questions: [
      { field: "lastSeenPlace", question: "Where was it last seen?" },
    ],
    items: [],
  });

  assert.equal(result.success, false);
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
