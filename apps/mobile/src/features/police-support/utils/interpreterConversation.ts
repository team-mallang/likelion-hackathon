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
    return updateTurn(state, action.turnId, (turn) => ({
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
        errorMessage: event.message,
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

  return updateTurn(state, event.turnId, (turn) => {
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
        originalText: event.text,
        sequence: event.sequence,
        status: "PARTIAL",
        errorMessage: null,
      };
    }

    if (event.type === "TRANSCRIPT_FINAL") {
      return {
        ...turn,
        originalText: event.text,
        sequence: event.sequence,
        status: "PARTIAL",
        errorMessage: null,
      };
    }

    if (event.type === "TRANSLATION_PARTIAL") {
      return {
        ...turn,
        translatedText: event.text,
        sequence: event.sequence,
        status: "PARTIAL",
        errorMessage: null,
      };
    }

    return {
      ...turn,
      translatedText: event.text,
      sequence: event.sequence,
      status: "FINAL",
      errorMessage: null,
    };
  });
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
  turnId: string,
  updater: (turn: InterpreterTurn) => InterpreterTurn,
): InterpreterConversationState {
  let changed = false;
  const turns = state.turns.map((turn) => {
    if (turn.turnId !== turnId) {
      return turn;
    }

    const nextTurn = updater(turn);
    changed ||= nextTurn !== turn;
    return nextTurn;
  });

  return changed ? { turns } : state;
}
