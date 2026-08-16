import { ungzip } from "pako";

import type { InterpreterEvent, StartInterpreterTurnInput } from "./interpreterEngine.types";

type JsonRecord = Record<string, unknown>;
type TranscriptResult = { text?: unknown; isFinal?: unknown };
type TranslationResult = { language?: unknown; texts?: unknown; isFinal?: unknown };

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
    return { type, constructorName, isArray, length: bytes.byteLength, firstBytes: Array.from(bytes.slice(0, 16), (byte) => byte.toString(16).padStart(2, "0")), isGzip, branch: `${branch}-${isGzip ? "gzip" : "utf8-json"}` };
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
    return { type, sessionId, turnId, sequence: ++sequence, text: value };
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
