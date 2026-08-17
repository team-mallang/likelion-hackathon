import type {
  InterpreterEvent,
  StartInterpreterTurnInput,
} from "@/features/police-support/services/interpreterEngine";
import type { InterpreterTurn } from "@/features/police-support/types/policeSupport";

export type InterpreterConversationState = {
  turns: InterpreterTurn[];
};

export type InterpreterConversationAction =
  | {
      type: "BEGIN_TURN";
      sessionId: string;
      input: StartInterpreterTurnInput;
    }
  | {
      type: "ENGINE_EVENT";
      event: InterpreterEvent;
    }
  | {
      type: "RETRY_TRANSLATION";
      turnId: string;
    }
  | {
      type: "CLEAR";
    };

export const initialInterpreterConversationState: InterpreterConversationState = {
  turns: [],
};

export function interpreterConversationReducer(
  state: InterpreterConversationState,
  action: InterpreterConversationAction,
): InterpreterConversationState {
  if (action.type === "CLEAR") {
    return initialInterpreterConversationState;
  }

  if (action.type === "BEGIN_TURN") {
    if (state.turns.some((turn) => turn.turnId === action.input.turnId)) {
      return state;
    }

    return {
      turns: [
        ...state.turns,
        {
          id: action.input.turnId,
          sessionId: action.sessionId,
          turnId: action.input.turnId,
          sentenceId: null,
          speakerRole: action.input.speakerRole,
          sourceLanguage: action.input.sourceLanguage,
          targetLanguage: action.input.targetLanguage,
          originalText: "",
          translatedText: null,
          sequence: 0,
          status: "PARTIAL",
          errorMessage: null,
        },
      ],
    };
  }

  if (action.type === "RETRY_TRANSLATION") {
    const target = [...state.turns]
      .reverse()
      .find((turn) => turn.turnId === action.turnId && turn.status === "TRANSLATION_FAILED");
    if (!target) return state;
    return updateTurn(state, target.id, (turn) => ({
      ...turn,
      translatedText: null,
      status: "PARTIAL",
      errorMessage: null,
    }));
  }

  const { event } = action;

  if (event.type === "ERROR" && event.turnId) {
    return updateTurn(state, event.turnId, (turn) => {
      if (turn.sessionId !== event.sessionId || turn.status === "FINAL") {
        return turn;
      }

      return {
        ...turn,
        status:
          event.code === "TRANSLATION_FAILED"
            ? "TRANSLATION_FAILED"
            : "TRANSCRIPTION_FAILED",
        errorMessage: safeInterpreterErrorMessage(event.code),
      };
    });
  }

  if (
    event.type !== "TRANSCRIPT_PARTIAL" &&
    event.type !== "TRANSCRIPT_FINAL" &&
    event.type !== "TRANSLATION_PARTIAL" &&
    event.type !== "TRANSLATION_FINAL"
  ) {
    return state;
  }

  const target = ensureTurnForEvent(state, event);
  if (!target) return state;

  return updateTurn(target.state, target.id, (turn) => {
    if (
      turn.sessionId !== event.sessionId ||
      event.sequence <= turn.sequence ||
      turn.status === "FINAL"
    ) {
      return turn;
    }

    if (event.type === "TRANSCRIPT_PARTIAL") {
      return {
        ...turn,
        sentenceId: turn.sentenceId ?? event.sentenceId ?? null,
        originalText: event.text,
        sequence: event.sequence,
        status: "PARTIAL",
        errorMessage: null,
      };
    }

    if (event.type === "TRANSCRIPT_FINAL") {
      return {
        ...turn,
        sentenceId: turn.sentenceId ?? event.sentenceId ?? null,
        originalText: event.text,
        sequence: event.sequence,
        status: "PARTIAL",
        errorMessage: null,
      };
    }

    if (event.type === "TRANSLATION_PARTIAL") {
      return {
        ...turn,
        sentenceId: turn.sentenceId ?? event.sentenceId ?? null,
        translatedText: event.text,
        sequence: event.sequence,
        status: "PARTIAL",
        errorMessage: null,
      };
    }

    return {
      ...turn,
      sentenceId: turn.sentenceId ?? event.sentenceId ?? null,
      translatedText: event.text,
      sequence: event.sequence,
      status: "FINAL",
      errorMessage: null,
    };
  });
}

function safeInterpreterErrorMessage(code: string) {
  if (code === "TRANSLATION_FAILED") {
    return "번역하지 못했습니다. 원문을 경찰관과 다시 확인해 주세요.";
  }

  if (code === "MICROPHONE_UNAVAILABLE") {
    return "음성을 문자로 변환하지 못했습니다. 마이크 상태를 확인해 주세요.";
  }

  return "음성을 문자로 변환하지 못했습니다. 원문을 다시 말해 주세요.";
}

export function getInterpreterLanguages(
  speakerRole: StartInterpreterTurnInput["speakerRole"],
): Pick<StartInterpreterTurnInput, "sourceLanguage" | "targetLanguage"> {
  return speakerRole === "TRAVELER"
    ? { sourceLanguage: "ko-KR", targetLanguage: "ja-JP" }
    : { sourceLanguage: "ja-JP", targetLanguage: "ko-KR" };
}

function updateTurn(
  state: InterpreterConversationState,
  id: string,
  updater: (turn: InterpreterTurn) => InterpreterTurn,
): InterpreterConversationState {
  let changed = false;
  const turns = state.turns.map((turn) => {
    if (turn.id !== id) {
      return turn;
    }

    const nextTurn = updater(turn);
    changed ||= nextTurn !== turn;
    return nextTurn;
  });

  return changed ? { turns } : state;
}

function ensureTurnForEvent(
  state: InterpreterConversationState,
  event: Extract<InterpreterEvent, { type: "TRANSCRIPT_PARTIAL" | "TRANSCRIPT_FINAL" | "TRANSLATION_PARTIAL" | "TRANSLATION_FINAL" }>,
): { state: InterpreterConversationState; id: string } | null {
  const matchingTurns = state.turns.filter(
    (turn) => turn.turnId === event.turnId && turn.sessionId === event.sessionId,
  );
  if (matchingTurns.length === 0) return null;

  // Legacy/RTM events do not carry Agora's sentence id. Keep their existing
  // one-turn behavior, while native Agora events are grouped per sentence.
  if (!event.sentenceId) {
    const latest = matchingTurns[matchingTurns.length - 1];
    return latest ? { state, id: latest.id } : null;
  }

  const existing = matchingTurns.find(
    (turn) => turn.sentenceId === event.sentenceId,
  );
  if (existing) return { state, id: existing.id };

  const placeholder = matchingTurns.find(
    (turn) =>
      turn.sentenceId === null &&
      turn.originalText.length === 0 &&
      turn.translatedText === null &&
      turn.sequence === 0,
  );
  if (placeholder) return { state, id: placeholder.id };

  const base = matchingTurns[matchingTurns.length - 1];
  const next: InterpreterTurn = {
    ...base,
    id: `${event.turnId}:${event.sentenceId}`,
    sentenceId: event.sentenceId,
    originalText: "",
    translatedText: null,
    sequence: 0,
    status: "PARTIAL",
    errorMessage: null,
  };
  return { state: { turns: [...state.turns, next] }, id: next.id };
}
