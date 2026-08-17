import assert from "node:assert/strict";
import test from "node:test";

import type { InterpreterEvent } from "../services/interpreterEngine";
import {
  getInterpreterLanguages,
  initialInterpreterConversationState,
  interpreterConversationReducer,
} from "./interpreterConversation";

const sessionId = "session-s14";
const turnId = "turn-s14";

function beginTravelerTurn() {
  return interpreterConversationReducer(initialInterpreterConversationState, {
    type: "BEGIN_TURN",
    sessionId,
    input: {
      turnId,
      speakerRole: "TRAVELER",
      ...getInterpreterLanguages("TRAVELER"),
    },
  });
}

function engineEvent(event: InterpreterEvent) {
  return { type: "ENGINE_EVENT" as const, event };
}

test("S14 maps each speaker to the correct Korean-Japanese direction", () => {
  assert.deepEqual(getInterpreterLanguages("TRAVELER"), {
    sourceLanguage: "ko-KR",
    targetLanguage: "ja-JP",
  });
  assert.deepEqual(getInterpreterLanguages("POLICE_OFFICER"), {
    sourceLanguage: "ja-JP",
    targetLanguage: "ko-KR",
  });
});

test("S14 ignores late partial and duplicate final events", () => {
  const started = beginTravelerTurn();
  const finalized = interpreterConversationReducer(
    interpreterConversationReducer(
      started,
      engineEvent({
        type: "TRANSCRIPT_FINAL",
        sessionId,
        turnId,
        sequence: 2,
        text: "여권도 잃어버렸어요.",
      }),
    ),
    engineEvent({
      type: "TRANSLATION_FINAL",
      sessionId,
      turnId,
      sequence: 4,
      text: "パスポートも失くしました。",
    }),
  );

  const afterLatePartial = interpreterConversationReducer(
    finalized,
    engineEvent({
      type: "TRANSCRIPT_PARTIAL",
      sessionId,
      turnId,
      sequence: 1,
      text: "여권도",
    }),
  );
  const afterDuplicateFinal = interpreterConversationReducer(
    afterLatePartial,
    engineEvent({
      type: "TRANSLATION_FINAL",
      sessionId,
      turnId,
      sequence: 4,
      text: "변조된 번역문",
    }),
  );

  assert.equal(afterLatePartial, finalized);
  assert.equal(afterDuplicateFinal, finalized);
  assert.equal(finalized.turns[0]?.translatedText, "パスポートも失くしました。");
  assert.equal(finalized.turns[0]?.status, "FINAL");
});

test("S14 keeps separate final sentences from one microphone turn", () => {
  const firstSentence = interpreterConversationReducer(
    beginTravelerTurn(),
    engineEvent({
      type: "TRANSCRIPT_FINAL",
      sessionId,
      turnId,
      sentenceId: "sentence-1",
      sequence: 1,
      text: "first source",
    }),
  );
  const firstFinal = interpreterConversationReducer(
    firstSentence,
    engineEvent({
      type: "TRANSLATION_FINAL",
      sessionId,
      turnId,
      sentenceId: "sentence-1",
      sequence: 2,
      text: "first target",
    }),
  );
  const secondSentence = interpreterConversationReducer(
    firstFinal,
    engineEvent({
      type: "TRANSCRIPT_FINAL",
      sessionId,
      turnId,
      sentenceId: "sentence-2",
      sequence: 3,
      text: "second source",
    }),
  );
  const result = interpreterConversationReducer(
    secondSentence,
    engineEvent({
      type: "TRANSLATION_FINAL",
      sessionId,
      turnId,
      sentenceId: "sentence-2",
      sequence: 4,
      text: "second target",
    }),
  );

  assert.equal(result.turns.length, 2);
  assert.deepEqual(
    result.turns.map(({ sentenceId, originalText, translatedText, status }) => ({ sentenceId, originalText, translatedText, status })),
    [
      { sentenceId: "sentence-1", originalText: "first source", translatedText: "first target", status: "FINAL" },
      { sentenceId: "sentence-2", originalText: "second source", translatedText: "second target", status: "FINAL" },
    ],
  );
});

test("S14 does not retain raw interpreter error messages in a turn", () => {
  const result = interpreterConversationReducer(
    beginTravelerTurn(),
    engineEvent({
      type: "ERROR",
      sessionId,
      turnId,
      code: "TRANSLATION_FAILED",
      message: "remote details: passport 12345678",
    }),
  );

  assert.equal(result.turns[0]?.status, "TRANSLATION_FAILED");
  assert.equal(
    result.turns[0]?.errorMessage,
    "번역하지 못했습니다. 원문을 경찰관과 다시 확인해 주세요.",
  );
  assert.equal(result.turns[0]?.errorMessage?.includes("12345678"), false);
});
