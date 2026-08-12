import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { POST } from "./route";

const originalFetch = globalThis.fetch;
const originalKey = process.env.ELEVENLABS_API_KEY;
const originalModel = process.env.ELEVENLABS_STT_MODEL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  restore("ELEVENLABS_API_KEY", originalKey);
  restore("ELEVENLABS_STT_MODEL", originalModel);
});

function restore(name: string, value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function createRequest(file?: File) {
  const formData = new FormData();
  if (file) formData.append("audio", file);
  return new Request("http://localhost/api/stt/transcribe", {
    method: "POST",
    body: formData,
  });
}

function audioFile(type = "audio/mp4", content = "audio") {
  return new File([content], "recording.m4a", { type });
}

test("STT route rejects a missing file", async () => {
  process.env.ELEVENLABS_API_KEY = "test-key";
  const response = await POST(createRequest());
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error, "AUDIO_FILE_REQUIRED");
});

test("STT route rejects unsupported audio MIME types", async () => {
  process.env.ELEVENLABS_API_KEY = "test-key";
  const response = await POST(createRequest(audioFile("audio/wav")));
  assert.equal(response.status, 415);
  assert.equal((await response.json()).error, "UNSUPPORTED_AUDIO_TYPE");
});

test("STT route returns an ElevenLabs transcript without persisting the file", async () => {
  process.env.ELEVENLABS_API_KEY = "test-key";
  process.env.ELEVENLABS_STT_MODEL = "scribe_v2";
  globalThis.fetch = (async (_input, init) => {
    assert.equal(init?.method, "POST");
    assert.equal(init?.headers instanceof Headers, false);
    assert.equal((init?.headers as Record<string, string>)["xi-api-key"], "test-key");
    return new Response(JSON.stringify({ text: "시부야역에서 휴대폰을 잃어버렸어요." }), { status: 200 });
  }) as typeof fetch;

  const response = await POST(createRequest(audioFile()));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    success: true,
    data: { statement: "시부야역에서 휴대폰을 잃어버렸어요." },
  });
});

test("STT route hides ElevenLabs failures", async () => {
  process.env.ELEVENLABS_API_KEY = "test-key";
  globalThis.fetch = (async () => new Response("provider detail", { status: 429 })) as typeof fetch;
  const response = await POST(createRequest(audioFile()));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, "TRANSCRIPTION_FAILED");
});

test("STT route rejects a successful response without text", async () => {
  process.env.ELEVENLABS_API_KEY = "test-key";
  globalThis.fetch = (async () => new Response(JSON.stringify({ language_code: "kor" }), { status: 200 })) as typeof fetch;
  const response = await POST(createRequest(audioFile()));
  assert.equal(response.status, 502);
  assert.equal((await response.json()).error, "EMPTY_TRANSCRIPTION");
});
