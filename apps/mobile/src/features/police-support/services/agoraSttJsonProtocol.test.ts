import assert from "node:assert/strict";
import test from "node:test";
import { gzip } from "pako";
import { Writer } from "protobufjs/minimal";

import { createAgoraSttJsonAssembler, decodeAgoraSttJsonPayload, decodeAgoraSttProtobufPayload, inspectAgoraSttPayload } from "./agoraSttJsonProtocol";

const encoder = new TextEncoder();
const turn = { turnId: "turn-1", speakerRole: "TRAVELER" as const, sourceLanguage: "ko-KR" as const, targetLanguage: "ja-JP" as const };

test("Agora JSON decoder accepts gzip bytes, plain bytes, and JSON strings", () => {
  const body = { transcript: { results: [] } };
  const json = JSON.stringify(body);
  assert.deepEqual(decodeAgoraSttJsonPayload(gzip(encoder.encode(json))), body);
  assert.deepEqual(decodeAgoraSttJsonPayload(encoder.encode(json)), body);
  assert.deepEqual(decodeAgoraSttJsonPayload(json), body);
  assert.equal(inspectAgoraSttPayload(gzip(encoder.encode(json))).branch, "uint8array-gzip-json");
});

test("Agora JSON decoder rejects invalid and empty payloads without exposing content", () => {
  assert.throws(() => decodeAgoraSttJsonPayload(encoder.encode("not-json")), SyntaxError);
  assert.throws(() => decodeAgoraSttJsonPayload(new Uint8Array()), SyntaxError);
});

function word(value: string, isFinal: boolean) {
  return Writer.create().uint32(10).string(value).uint32(32).bool(isFinal).finish();
}

function translation(language: string, value: string, isFinal: boolean) {
  return Writer.create().uint32(8).bool(isFinal).uint32(18).string(language).uint32(26).string(value).finish();
}

function textMessage(input: { dataType: "transcribe" | "translate"; culture?: string; sentenceId: number; words?: Array<[string, boolean]>; translations?: Array<[string, string, boolean]>; originalCulture?: string }) {
  const writer = Writer.create().uint32(106).string(input.dataType).uint32(152).int64(input.sentenceId);
  if (input.culture) writer.uint32(122).string(input.culture);
  for (const [value, isFinal] of input.words ?? []) writer.uint32(82).bytes(word(value, isFinal));
  for (const [language, value, isFinal] of input.translations ?? []) writer.uint32(114).bytes(translation(language, value, isFinal));
  if (input.originalCulture) {
    const original = Writer.create().uint32(10).string(input.originalCulture);
    for (const [value, isFinal] of input.words ?? []) original.uint32(18).bytes(word(value, isFinal));
    writer.uint32(146).bytes(original.finish());
  }
  return writer.finish();
}

test("Agora protobuf decoder uses the official Text field numbers", () => {
  const payload = textMessage({ dataType: "transcribe", culture: "ko-KR", sentenceId: 77, words: [["hello", true]] });
  assert.equal(inspectAgoraSttPayload(payload).branch, "uint8array-protobuf");
  assert.deepEqual(decodeAgoraSttProtobufPayload(payload), {
    dataType: "transcribe", culture: "ko-KR", textTs: "", sentenceId: "77", words: [{ text: "hello", isFinal: true }], translations: [], originalTranscript: null,
  });
});

test("Agora protobuf assembler preserves sentence pairing, finals, and both language directions", () => {
  const parser = createAgoraSttJsonAssembler();
  parser.setTurn(turn);
  const korean = textMessage({ dataType: "transcribe", culture: "ko-KR", sentenceId: 10, words: [["source", true]] });
  const japanese = textMessage({ dataType: "translate", sentenceId: 10, translations: [["ja-JP", "target", true]], originalCulture: "ko-KR" });
  assert.deepEqual(parser.parse(korean, "live-1").map((event) => event.type), ["TRANSCRIPT_FINAL"]);
  assert.deepEqual(parser.parse(japanese, "live-1").map((event) => event.type), ["TRANSLATION_FINAL"]);
  assert.deepEqual(parser.parse(japanese, "live-1"), []);

  const reverse = createAgoraSttJsonAssembler();
  reverse.setTurn({ ...turn, turnId: "turn-2", sourceLanguage: "ja-JP", targetLanguage: "ko-KR" });
  const japaneseSource = textMessage({ dataType: "transcribe", culture: "ja-JP", sentenceId: 11, words: [["source", false]] });
  const koreanTarget = textMessage({ dataType: "translate", sentenceId: 11, translations: [["ko-KR", "target", false]], originalCulture: "ja-JP" });
  assert.deepEqual(reverse.parse(japaneseSource, "live-1").map((event) => event.type), ["TRANSCRIPT_PARTIAL"]);
  assert.deepEqual(reverse.parse(koreanTarget, "live-1").map((event) => event.type), ["TRANSLATION_PARTIAL"]);
});

test("Agora protobuf assembler keeps distinct final sentence ids in one microphone turn", () => {
  const parser = createAgoraSttJsonAssembler();
  parser.setTurn(turn);
  const first = textMessage({ dataType: "transcribe", culture: "ko-KR", sentenceId: 21, words: [["first", true]] });
  const second = textMessage({ dataType: "transcribe", culture: "ko-KR", sentenceId: 22, words: [["second", true]] });

  assert.deepEqual(
    [
      ...parser.parse(first, "live-1"),
      ...parser.parse(second, "live-1"),
    ].map((event) => [event.type, "sentenceId" in event ? event.sentenceId : null, "text" in event ? event.text : null]),
    [
      ["TRANSCRIPT_FINAL", "21", "first"],
      ["TRANSCRIPT_FINAL", "22", "second"],
    ],
  );
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
