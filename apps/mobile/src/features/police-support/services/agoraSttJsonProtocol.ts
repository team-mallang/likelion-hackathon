import { inflate } from "pako";

import type { InterpreterEvent, StartInterpreterTurnInput } from "./interpreterEngine.types";

type JsonRecord = Record<string, unknown>;
type TranscriptResult = { text?: unknown; isFinal?: unknown };
type TranslationResult = { language?: unknown; texts?: unknown; isFinal?: unknown };

export type AgoraSttJsonAssembler = {
  setTurn(turn: StartInterpreterTurnInput): void;
  clearTurn(turnId?: string): void;
  parse(data: Uint8Array, sessionId: string): InterpreterEvent[];
};

function record(value: unknown): JsonRecord | null { return typeof value === "object" && value !== null ? value as JsonRecord : null; }
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function bool(value: unknown) { return value === true; }
function decode(data: Uint8Array) {
  const bytes = data[0] === 0x1f && data[1] === 0x8b ? inflate(data) : data;
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
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
      const body = record(decode(data));
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
