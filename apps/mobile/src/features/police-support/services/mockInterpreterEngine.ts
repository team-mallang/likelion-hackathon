import {
  InterpreterEngineError,
  type InterpreterEngine,
  type InterpreterEvent,
  type InterpreterEventListener,
  type StartInterpreterTurnInput,
} from "@/features/police-support/services/interpreterEngine";
import type { InterpreterSessionCredentials } from "@/features/police-support/types/policeSupport";

export type MockInterpreterEngineOptions = {
  eventDelayMs?: number;
  failConnection?: boolean;
  failTranscription?: boolean;
  failTranslation?: boolean;
  emitLatePartial?: boolean;
  emitDuplicateFinal?: boolean;
  disconnectWhileStopping?: boolean;
};

type MockTurnScript = {
  partialTranscript: string;
  finalTranscript: string;
  partialTranslation: string;
  finalTranslation: string;
};

const DEFAULT_EVENT_DELAY_MS = 80;

const scripts: Record<StartInterpreterTurnInput["speakerRole"], MockTurnScript> = {
  TRAVELER: {
    partialTranscript: "여권도",
    finalTranscript: "여권도 잃어버렸어요.",
    partialTranslation: "パスポートも",
    finalTranslation: "パスポートも失くしました。",
  },
  POLICE_OFFICER: {
    partialTranscript: "大使館に",
    finalTranscript: "大使館に連絡する必要があります。",
    partialTranslation: "대사관에",
    finalTranslation: "대사관에 연락해야 합니다.",
  },
};

function isExpired(expiresAt: string) {
  const expiry = new Date(expiresAt).getTime();
  return Number.isNaN(expiry) || expiry <= Date.now();
}

export function createMockInterpreterEngine(
  options: MockInterpreterEngineOptions = {},
): InterpreterEngine {
  const listeners = new Set<InterpreterEventListener>();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let credentials: InterpreterSessionCredentials | null = null;
  let activeTurn: StartInterpreterTurnInput | null = null;
  let isConnected = false;

  function emit(event: InterpreterEvent) {
    listeners.forEach((listener) => listener(event));
  }

  function schedule(event: InterpreterEvent, order: number) {
    const timer = setTimeout(() => {
      timers.delete(timer);

      if (!isConnected) {
        return;
      }

      emit(event);
    }, Math.max(0, options.eventDelayMs ?? DEFAULT_EVENT_DELAY_MS) * order);

    timers.add(timer);
  }

  function clearTimers() {
    timers.forEach((timer) => clearTimeout(timer));
    timers.clear();
  }

  return {
    async connect(nextCredentials) {
      if (isExpired(nextCredentials.expiresAt)) {
        throw new InterpreterEngineError(
          "SESSION_EXPIRED",
          "통역 세션이 만료되었습니다.",
        );
      }

      emit({ type: "CONNECTION_STATE_CHANGED", state: "CONNECTING" });

      if (options.failConnection) {
        emit({ type: "CONNECTION_STATE_CHANGED", state: "FAILED" });
        throw new InterpreterEngineError(
          "CONNECTION_FAILED",
          "통역 세션에 연결하지 못했습니다.",
        );
      }

      credentials = nextCredentials;
      isConnected = true;
      emit({ type: "CONNECTION_STATE_CHANGED", state: "CONNECTED" });
    },

    async startTurn(input) {
      if (!credentials || !isConnected) {
        throw new InterpreterEngineError(
          "NOT_CONNECTED",
          "통역 세션에 먼저 연결해 주세요.",
        );
      }

      if (activeTurn) {
        throw new InterpreterEngineError(
          "TURN_ALREADY_ACTIVE",
          "현재 발화를 먼저 종료해 주세요.",
        );
      }

      if (input.sourceLanguage === input.targetLanguage) {
        throw new InterpreterEngineError(
          "INVALID_SESSION",
          "입력 언어와 번역 언어는 달라야 합니다.",
        );
      }

      const hasExpectedLanguageDirection =
        (input.speakerRole === "TRAVELER" &&
          input.sourceLanguage === "ko-KR" &&
          input.targetLanguage === "ja-JP") ||
        (input.speakerRole === "POLICE_OFFICER" &&
          input.sourceLanguage === "ja-JP" &&
          input.targetLanguage === "ko-KR");

      if (!hasExpectedLanguageDirection) {
        throw new InterpreterEngineError(
          "INVALID_SESSION",
          "선택한 화자와 통역 언어 방향이 일치하지 않습니다.",
        );
      }

      activeTurn = input;
      const script = scripts[input.speakerRole];
      const sessionId = credentials.sessionId;

      if (options.failTranscription) {
        return;
      }

      schedule(
        {
          type: "TRANSCRIPT_PARTIAL",
          sessionId,
          turnId: input.turnId,
          sequence: 1,
          text: script.partialTranscript,
        },
        1,
      );
    },

    async muteTurn() {
      if (!credentials || !isConnected || !activeTurn) {
        throw new InterpreterEngineError("NO_ACTIVE_TURN", "No active turn.");
      }
    },

    async stopTurn() {
      if (!credentials || !isConnected) {
        throw new InterpreterEngineError(
          "NOT_CONNECTED",
          "연결된 통역 세션이 없습니다.",
        );
      }

      if (!activeTurn) {
        throw new InterpreterEngineError(
          "NO_ACTIVE_TURN",
          "종료할 발화가 없습니다.",
        );
      }

      const completedTurn = activeTurn;
      const script = scripts[completedTurn.speakerRole];
      const sessionId = credentials.sessionId;
      clearTimers();
      activeTurn = null;
      emit({
        type: "TURN_STOPPED",
        sessionId,
        turnId: completedTurn.turnId,
      });

      if (options.disconnectWhileStopping) {
        isConnected = false;
        credentials = null;
        emit({ type: "CONNECTION_STATE_CHANGED", state: "DISCONNECTED" });
        return;
      }

      if (options.failTranscription) {
        schedule(
          {
            type: "ERROR",
            sessionId,
            turnId: completedTurn.turnId,
            code: "TRANSCRIPTION_FAILED",
            message: "음성을 문자로 변환하지 못했습니다.",
          },
          1,
        );
        return;
      }

      schedule(
        {
          type: "TRANSCRIPT_FINAL",
          sessionId,
          turnId: completedTurn.turnId,
          sequence: 2,
          text: script.finalTranscript,
        },
        1,
      );

      if (options.failTranslation) {
        schedule(
          {
            type: "ERROR",
            sessionId,
            turnId: completedTurn.turnId,
            code: "TRANSLATION_FAILED",
            message: "번역문을 만들지 못했습니다.",
          },
          2,
        );
        return;
      }

      schedule(
        {
          type: "TRANSLATION_PARTIAL",
          sessionId,
          turnId: completedTurn.turnId,
          sequence: 3,
          text: script.partialTranslation,
        },
        2,
      );
      schedule(
        {
          type: "TRANSLATION_FINAL",
          sessionId,
          turnId: completedTurn.turnId,
          sequence: 4,
          text: script.finalTranslation,
        },
        3,
      );

      if (options.emitLatePartial) {
        schedule(
          {
            type: "TRANSCRIPT_PARTIAL",
            sessionId,
            turnId: completedTurn.turnId,
            sequence: 1,
            text: script.partialTranscript,
          },
          4,
        );
      }

      if (options.emitDuplicateFinal) {
        schedule(
          {
            type: "TRANSLATION_FINAL",
            sessionId,
            turnId: completedTurn.turnId,
            sequence: 4,
            text: script.finalTranslation,
          },
          5,
        );
      }
    },

    async renewCredentials(nextCredentials) {
      if (!credentials || !isConnected) {
        throw new InterpreterEngineError(
          "NOT_CONNECTED",
          "갱신할 통역 세션이 없습니다.",
        );
      }

      if (
        nextCredentials.sessionId !== credentials.sessionId ||
        nextCredentials.channelName !== credentials.channelName ||
        nextCredentials.uid !== credentials.uid ||
        isExpired(nextCredentials.expiresAt)
      ) {
        throw new InterpreterEngineError(
          "INVALID_SESSION",
          "갱신된 통역 세션 정보가 기존 채널과 일치하지 않습니다.",
        );
      }

      credentials = nextCredentials;
    },

    async disconnect() {
      clearTimers();
      activeTurn = null;
      isConnected = false;
      credentials = null;
      emit({ type: "CONNECTION_STATE_CHANGED", state: "DISCONNECTED" });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
