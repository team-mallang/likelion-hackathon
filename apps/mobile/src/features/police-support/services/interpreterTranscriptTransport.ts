import type {
  InterpreterEngineErrorCode,
  InterpreterEvent,
  StartInterpreterTurnInput,
} from "@/features/police-support/services/interpreterEngine.types";
import type { InterpreterSessionCredentials } from "@/features/police-support/types/policeSupport";

export type BackendInterpreterMessage =
  | {
      type:
        | "transcript.partial"
        | "transcript.final"
        | "translation.partial"
        | "translation.final";
      sessionId: string;
      turnId: string;
      sequence: number;
      text: string;
    }
  | {
      type: "error";
      sessionId: string;
      turnId: string | null;
      code: InterpreterEngineErrorCode;
      message: string;
    };

export type InterpreterTranscriptTransport = {
  // A production implementation subscribes to the session's Agora RTM channel
  // with credentials.rtmToken and forwards only user.transcription events.
  // The current react-native-agora package is RTC-only, so the native RTM
  // adapter is intentionally kept behind this contract.
  connect(input: {
    credentials: InterpreterSessionCredentials;
    onMessage: (message: BackendInterpreterMessage) => void;
  }): Promise<void>;
  startTurn(input: StartInterpreterTurnInput): Promise<void>;
  stopTurn(turnId: string): Promise<void>;
  renewCredentials(credentials: InterpreterSessionCredentials): Promise<void>;
  disconnect(): Promise<void>;
};

export function normalizeBackendInterpreterMessage(
  message: BackendInterpreterMessage,
): InterpreterEvent | null {
  if (message.type === "error") {
    return {
      type: "ERROR",
      sessionId: message.sessionId,
      turnId: message.turnId,
      code: message.code,
      message: message.message,
    };
  }

  if (
    !message.sessionId ||
    !message.turnId ||
    !Number.isSafeInteger(message.sequence) ||
    message.sequence < 1 ||
    !message.text.trim()
  ) {
    return null;
  }

  const typeByBackendType = {
    "transcript.partial": "TRANSCRIPT_PARTIAL",
    "transcript.final": "TRANSCRIPT_FINAL",
    "translation.partial": "TRANSLATION_PARTIAL",
    "translation.final": "TRANSLATION_FINAL",
  } as const;

  return {
    type: typeByBackendType[message.type],
    sessionId: message.sessionId,
    turnId: message.turnId,
    sequence: message.sequence,
    text: message.text,
  };
}
