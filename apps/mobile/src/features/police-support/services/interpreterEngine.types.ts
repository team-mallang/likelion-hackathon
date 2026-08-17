import type {
  InterpreterSessionCredentials,
  SpeakerRole,
  SupportedLanguage,
} from "@/features/police-support/types/policeSupport";

export type InterpreterConnectionState =
  | "DISCONNECTED"
  | "CONNECTING"
  | "CONNECTED"
  | "RECONNECTING"
  | "FAILED";

export type InterpreterEngineErrorCode =
  | "INVALID_SESSION"
  | "SESSION_EXPIRED"
  | "NOT_CONNECTED"
  | "TURN_ALREADY_ACTIVE"
  | "NO_ACTIVE_TURN"
  | "MICROPHONE_UNAVAILABLE"
  | "TRANSCRIPTION_FAILED"
  | "TRANSLATION_FAILED"
  | "CONNECTION_FAILED";

export class InterpreterEngineError extends Error {
  constructor(
    public readonly code: InterpreterEngineErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "InterpreterEngineError";
  }
}

type InterpreterTextEvent = {
  sessionId: string;
  turnId: string;
  /** Agora sentence identity. A microphone turn may contain many sentences. */
  sentenceId?: string;
  sequence: number;
  text: string;
};

export type InterpreterEvent =
  | {
      type: "CONNECTION_STATE_CHANGED";
      state: InterpreterConnectionState;
    }
  | ({ type: "TRANSCRIPT_PARTIAL" } & InterpreterTextEvent)
  | ({ type: "TRANSCRIPT_FINAL" } & InterpreterTextEvent)
  | ({ type: "TRANSLATION_PARTIAL" } & InterpreterTextEvent)
  | ({ type: "TRANSLATION_FINAL" } & InterpreterTextEvent)
  | {
      type: "TURN_STOPPED";
      sessionId: string;
      turnId: string;
    }
  | {
      type: "TOKEN_WILL_EXPIRE";
      sessionId: string;
      expiresAt: string;
    }
  | {
      type: "ERROR";
      sessionId: string | null;
      turnId: string | null;
      code: InterpreterEngineErrorCode;
      message: string;
    };

export type StartInterpreterTurnInput = {
  turnId: string;
  speakerRole: SpeakerRole;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
};

export type InterpreterEventListener = (event: InterpreterEvent) => void;

export type InterpreterEngine = {
  connect(credentials: InterpreterSessionCredentials): Promise<void>;
  startTurn(input: StartInterpreterTurnInput): Promise<void>;
  muteTurn(): Promise<void>;
  stopTurn(): Promise<void>;
  renewCredentials(credentials: InterpreterSessionCredentials): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(listener: InterpreterEventListener): () => void;
};
