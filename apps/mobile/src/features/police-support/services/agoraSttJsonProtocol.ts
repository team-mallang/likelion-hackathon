import { ungzip } from "pako";
import { Reader } from "protobufjs/minimal";

import type { InterpreterEvent, StartInterpreterTurnInput } from "./interpreterEngine.types";

type JsonRecord = Record<string, unknown>;
type TranscriptResult = { text?: unknown; isFinal?: unknown };
type TranslationResult = { language?: unknown; texts?: unknown; isFinal?: unknown };

/**
 * This is the official Agora `Agora.SpeechToText.Text` wire schema from
 * SttMessage.proto. Keep the field numbers in sync with Agora's published
 * schema; stream messages are protobuf by default even when JSON has been
 * requested for a task.
 */
type AgoraProtobufWord = { text: string; isFinal: boolean };
type AgoraProtobufTranslation = { language: string; texts: string[]; isFinal: boolean };
type AgoraProtobufText = {
  dataType: string;
  culture: string;
  textTs: string;
  sentenceId: string;
  words: AgoraProtobufWord[];
  translations: AgoraProtobufTranslation[];
  originalTranscript: { culture: string; words: AgoraProtobufWord[] } | null;
};

export type AgoraSttJsonAssembler = {
  setTurn(turn: StartInterpreterTurnInput): void;
  clearTurn(turnId?: string): void;
  parse(data: unknown, sessionId: string): InterpreterEvent[];
};

export type AgoraSttPayloadDebug = {
  type: string;
  constructorName: string | null;
  isArray: boolean;
  length: number | null;
  firstBytes: string[];
  isGzip: boolean;
  branch: string;
};

function record(value: unknown): JsonRecord | null { return typeof value === "object" && value !== null ? value as JsonRecord : null; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function bool(value: unknown) { return value === true; }
function firstNonWhitespace(bytes: Uint8Array) {
  for (const byte of bytes) if (byte !== 0x20 && byte !== 0x09 && byte !== 0x0a && byte !== 0x0d) return byte;
  return null;
}
function toUint8Array(payload: unknown): { bytes: Uint8Array; branch: string } {
  if (payload instanceof Uint8Array) return { bytes: payload, branch: "uint8array" };
  if (Array.isArray(payload) && payload.every((item) => Number.isInteger(item) && item >= 0 && item <= 255)) {
    return { bytes: Uint8Array.from(payload), branch: "number-array" };
  }
  if (payload instanceof ArrayBuffer) return { bytes: new Uint8Array(payload), branch: "arraybuffer" };
  if (ArrayBuffer.isView(payload)) {
    return { bytes: new Uint8Array(payload.buffer, payload.byteOffset, payload.byteLength), branch: "arraybuffer-view" };
  }
  throw new Error("Unsupported Agora RTC stream message payload type.");
}

export function inspectAgoraSttPayload(payload: unknown): AgoraSttPayloadDebug {
  const type = typeof payload;
  const constructorName = payload && typeof payload === "object" ? (payload as { constructor?: { name?: string } }).constructor?.name ?? null : null;
  const isArray = Array.isArray(payload);
  if (typeof payload === "string") {
    const bytes = new TextEncoder().encode(payload);
    return { type, constructorName, isArray, length: payload.length, firstBytes: Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")), isGzip: false, branch: "string-json" };
  }
  try {
    const { bytes, branch } = toUint8Array(payload);
    const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
    const leading = firstNonWhitespace(bytes);
    const protocol = isGzip ? "gzip-json" : leading === 0x7b || leading === 0x5b ? "json" : "protobuf";
    return { type, constructorName, isArray, length: bytes.byteLength, firstBytes: Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")), isGzip, branch: `${branch}-${protocol}` };
  } catch {
    return { type, constructorName, isArray, length: null, firstBytes: [], isGzip: false, branch: "unsupported" };
  }
}

export function decodeAgoraSttJsonPayload(payload: unknown): unknown {
  if (typeof payload === "string") return JSON.parse(payload) as unknown;
  const { bytes } = toUint8Array(payload);
  const decoded = bytes[0] === 0x1f && bytes[1] === 0x8b ? ungzip(bytes) : bytes;
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(decoded)) as unknown;
}

function int64(reader: Reader) { return reader.int64().toString(); }

function decodeWord(reader: Reader, length: number): AgoraProtobufWord {
  const end = reader.pos + length;
  let value = "";
  let isFinal = false;
  while (reader.pos < end) {
    const tag = reader.uint32();
    if (tag === 10) value = reader.string();
    else if (tag === 32) isFinal = reader.bool();
    else reader.skipType(tag & 7);
  }
  return { text: value, isFinal };
}

function decodeTranslation(reader: Reader, length: number): AgoraProtobufTranslation {
  const end = reader.pos + length;
  let isFinal = false;
  let language = "";
  const texts: string[] = [];
  while (reader.pos < end) {
    const tag = reader.uint32();
    if (tag === 8) isFinal = reader.bool();
    else if (tag === 18) language = reader.string();
    else if (tag === 26) texts.push(reader.string());
    else reader.skipType(tag & 7);
  }
  return { isFinal, language, texts };
}

function decodeOriginalTranscript(reader: Reader, length: number) {
  const end = reader.pos + length;
  let culture = "";
  const words: AgoraProtobufWord[] = [];
  while (reader.pos < end) {
    const tag = reader.uint32();
    if (tag === 10) culture = reader.string();
    else if (tag === 18) words.push(decodeWord(reader, reader.uint32()));
    else reader.skipType(tag & 7);
  }
  return { culture, words };
}

export function decodeAgoraSttProtobufPayload(payload: unknown): AgoraProtobufText {
  const { bytes } = toUint8Array(payload);
  const reader = Reader.create(bytes);
  const message: AgoraProtobufText = {
    dataType: "", culture: "", textTs: "", sentenceId: "", words: [], translations: [], originalTranscript: null,
  };
  while (reader.pos < reader.len) {
    const tag = reader.uint32();
    switch (tag) {
      case 32: int64(reader); break; // uid
      case 48: int64(reader); break; // time
      case 82: message.words.push(decodeWord(reader, reader.uint32())); break;
      case 96: reader.int32(); break; // duration_ms
      case 106: message.dataType = reader.string(); break;
      case 114: message.translations.push(decodeTranslation(reader, reader.uint32())); break;
      case 122: message.culture = reader.string(); break;
      case 128: message.textTs = int64(reader); break;
      case 146: message.originalTranscript = decodeOriginalTranscript(reader, reader.uint32()); break;
      case 152: message.sentenceId = int64(reader); break;
      default: reader.skipType(tag & 7);
    }
  }
  return message;
}

function isJsonPayload(data: unknown) {
  if (typeof data === "string") return true;
  const { bytes } = toUint8Array(data);
  return (bytes[0] === 0x1f && bytes[1] === 0x8b) || firstNonWhitespace(bytes) === 0x7b || firstNonWhitespace(bytes) === 0x5b;
}

export function createAgoraSttJsonAssembler(): AgoraSttJsonAssembler {
  let activeTurn: StartInterpreterTurnInput | null = null;
  let sequence = 0;
  const delivered = new Set<string>();
  const sentenceTurns = new Map<string, StartInterpreterTurnInput>();

  function event(type: InterpreterEvent["type"], sessionId: string, turnId: string, sentenceId: string, value: string): InterpreterEvent | null {
    if (type !== "TRANSCRIPT_PARTIAL" && type !== "TRANSCRIPT_FINAL" && type !== "TRANSLATION_PARTIAL" && type !== "TRANSLATION_FINAL") return null;
    const key = `${type}:${turnId}:${sentenceId}:${value}`;
    if (!value || delivered.has(key)) return null;
    delivered.add(key);
    return { type, sessionId, turnId, sentenceId: sentenceId || undefined, sequence: ++sequence, text: value };
  }

  return {
    setTurn(turn) { activeTurn = turn; },
    clearTurn(turnId) {
      if (!turnId || activeTurn?.turnId === turnId) activeTurn = null;
      if (!turnId) sentenceTurns.clear();
    },
    parse(data, sessionId) {
      const current = activeTurn;
      if (!current) return [];
      if (!isJsonPayload(data)) {
        const protobuf = decodeAgoraSttProtobufPayload(data);
        const sentenceId = protobuf.sentenceId || protobuf.textTs;
        const sourceLanguage = protobuf.originalTranscript?.culture || protobuf.culture;
        const out: InterpreterEvent[] = [];
        if (protobuf.dataType === "transcribe") {
          if (sourceLanguage && sourceLanguage !== current.sourceLanguage) return out;
          if (sentenceId) sentenceTurns.set(sentenceId, current);
          const value = protobuf.words.map((word) => word.text.trim()).filter(Boolean).join("");
          const next = event(protobuf.words.every((word) => word.isFinal) ? "TRANSCRIPT_FINAL" : "TRANSCRIPT_PARTIAL", sessionId, current.turnId, sentenceId, value);
          if (next) out.push(next);
        }
        if (protobuf.dataType === "translate") {
          if (sourceLanguage && sourceLanguage !== current.sourceLanguage) return out;
          const translationTurn = sentenceTurns.get(sentenceId) ?? current;
          for (const translation of protobuf.translations) {
            if (translation.language !== translationTurn.targetLanguage) continue;
            const next = event(translation.isFinal ? "TRANSLATION_FINAL" : "TRANSLATION_PARTIAL", sessionId, translationTurn.turnId, sentenceId, translation.texts.map((value) => value.trim()).filter(Boolean).join(""));
            if (next) out.push(next);
          }
        }
        return out;
      }
      const body = record(decodeAgoraSttJsonPayload(data));
      if (!body) return [];
      const out: InterpreterEvent[] = [];
      const transcript = record(body.transcript);
      if (transcript) {
        if (text(transcript.language) && text(transcript.language) !== current.sourceLanguage) return out;
        const sentenceId = String(transcript.sentenceId ?? transcript.textTs ?? "");
        if (sentenceId) sentenceTurns.set(sentenceId, current);
        const results = Array.isArray(transcript.results) ? transcript.results : [transcript];
        for (const item of results) {
          const result = record(item) as TranscriptResult | null;
          const next = event(bool(result?.isFinal) ? "TRANSCRIPT_FINAL" : "TRANSCRIPT_PARTIAL", sessionId, current.turnId, sentenceId, text(result?.text));
          if (next) out.push(next);
        }
      }
      const translation = record(body.translation);
      if (translation) {
        const original = record(translation.original_transcript);
        if (text(original?.language) && text(original?.language) !== current.sourceLanguage) return out;
        const sentenceId = String(translation.sentenceId ?? translation.textTs ?? "");
        const translationTurn = sentenceTurns.get(sentenceId) ?? current;
        const results = Array.isArray(translation.results) ? translation.results : [translation.results0 ?? translation];
        for (const item of results) {
          const result = record(item) as TranslationResult | null;
          if (text(result?.language) !== translationTurn.targetLanguage) continue;
          const value = Array.isArray(result?.texts) ? result.texts.map(text).filter(Boolean).join("") : "";
          const next = event(bool(result?.isFinal ?? translation.isFinal) ? "TRANSLATION_FINAL" : "TRANSLATION_PARTIAL", sessionId, translationTurn.turnId, sentenceId, value);
          if (next) out.push(next);
        }
      }
      return out;
    },
  };
}
