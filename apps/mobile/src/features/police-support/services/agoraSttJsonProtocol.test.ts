import assert from "node:assert/strict";
import test from "node:test";
import { gzip } from "pako";

import { createAgoraSttJsonAssembler, decodeAgoraSttJsonPayload, inspectAgoraSttPayload } from "./agoraSttJsonProtocol";

const encoder = new TextEncoder();
const turn = { turnId: "turn-1", speakerRole: "TRAVELER" as const, sourceLanguage: "ko-KR" as const, targetLanguage: "ja-JP" as const };

test("Agora JSON decoder accepts gzip bytes, plain bytes, and JSON strings", () => {
  const body = { transcript: { results: [] } };
  const json = JSON.stringify(body);
  assert.deepEqual(decodeAgoraSttJsonPayload(gzip(encoder.encode(json))), body);
  assert.deepEqual(decodeAgoraSttJsonPayload(encoder.encode(json)), body);
  assert.deepEqual(decodeAgoraSttJsonPayload(json), body);
  assert.equal(inspectAgoraSttPayload(gzip(encoder.encode(json))).branch, "uint8array-gzip");
});

test("Agora JSON decoder rejects invalid and empty payloads without exposing content", () => {
  assert.throws(() => decodeAgoraSttJsonPayload(encoder.encode("not-json")), SyntaxError);
  assert.throws(() => decodeAgoraSttJsonPayload(new Uint8Array()), SyntaxError);
});

test("Agora JSON parser reads gzip, mixed results, and suppresses duplicate finals", () => {
  const parser = createAgoraSttJsonAssembler();
  parser.setTurn(turn);
  const transcript = gzip(encoder.encode(JSON.stringify({ transcript: { results: [
    { text: "지갑을", isFinal: true }, { text: " 잃어", isFinal: false },
  ] } })));
  assert.deepEqual(parser.parse(transcript, "live-1").map((event) => [event.type, "text" in event ? event.text : ""]), [
    ["TRANSCRIPT_FINAL", "지갑을"], ["TRANSCRIPT_PARTIAL", "잃어"],
  ]);
  const translation = encoder.encode(JSON.stringify({ translation: { isFinal: true, results: [
    { language: "ja-JP", texts: ["財布を失くしました。"], isFinal: true },
    { language: "en-US", texts: ["ignored"], isFinal: true },
  ] } }));
  assert.deepEqual(parser.parse(translation, "live-1").map((event) => [event.type, "text" in event ? event.text : ""]), [["TRANSLATION_FINAL", "財布を失くしました。"]]);
  assert.deepEqual(parser.parse(translation, "live-1"), []);
  assert.deepEqual(parser.parse(encoder.encode(JSON.stringify({ transcript: { results: [] } })), "live-1"), []);
});
