import type {
  InterpreterEngine,
  InterpreterEngineErrorCode,
  InterpreterEvent,
  InterpreterEventListener,
  StartInterpreterTurnInput,
} from "@/features/police-support/services/interpreterEngine";
import type {
  LiveAssistanceContextClient,
  LiveAssistanceContextResult,
} from "@/features/police-support/services/liveAssistanceContext";
import type { LiveAssistanceSessionService } from "@/features/police-support/services/liveAssistanceSession";
import type { InterpreterSessionCredentials } from "@/features/police-support/types/policeSupport";

export type LiveAssistanceCoreState =
  | "IDLE"
  | "STARTING"
  | "CONNECTED"
  | "PROCESSING_CONTEXT"
  | "STOPPING"
  | "FAILED"
  | "EXPIRED";

export type LiveAssistanceCoreErrorCode =
  | "SESSION_CREATION_FAILED"
  | "RTC_CONNECTION_FAILED"
  | "RTM_CONNECTION_FAILED"
  | "TRANSCRIPT_PARSING_FAILED"
  | "CONTEXT_PROCESSING_FAILED"
  | "SESSION_CLOSE_FAILED"
  | "SESSION_EXPIRED"
  | "MICROPHONE_UNAVAILABLE"
  | "NETWORK_DISCONNECTED";

export type LiveAssistanceCoreEvent =
  | { type: "STATE_CHANGED"; state: LiveAssistanceCoreState }
  | { type: "ENGINE_EVENT"; event: InterpreterEvent }
  | { type: "CONTEXT_PROCESSING"; sessionId: string; turnId: string }
  | { type: "ASSISTANCE_FINAL"; sessionId: string; turnId: string; result: LiveAssistanceContextResult }
  | { type: "ERROR"; code: LiveAssistanceCoreErrorCode; message: string; cause?: unknown };

export type LiveAssistanceCoreListener = (event: LiveAssistanceCoreEvent) => void;

export type LiveAssistanceCore = {
  startSession(input: { caseId: string; accessToken: string }): Promise<InterpreterSessionCredentials>;
  stopSession(): Promise<void>;
  setMicrophoneEnabled(input: { enabled: boolean; turn?: StartInterpreterTurnInput }): Promise<void>;
  completeTurn(turnId: string): Promise<void>;
  getCredentials(): InterpreterSessionCredentials | null;
  getState(): LiveAssistanceCoreState;
  subscribe(listener: LiveAssistanceCoreListener): () => void;
};

type Dependencies = {
  sessionService: LiveAssistanceSessionService;
  contextClient: LiveAssistanceContextClient;
  interpreterEngine: InterpreterEngine;
};

const RECENT_STATEMENT_LIMIT = 5;

function logCoreError(scope: string, cause: unknown) {
  if (cause instanceof Error) {
    console.error(`[LiveAssistance][Core] ${scope}`, {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    });
    return;
  }

  console.error(`[LiveAssistance][Core] ${scope}`, cause);
}

function keyForAssistanceInput(event: Extract<InterpreterEvent, { type: "TRANSCRIPT_FINAL" | "TRANSLATION_FINAL" }>) {
  return `${event.sessionId}:${event.turnId}:${event.sequence}:${event.text}`;
}

function mapEngineError(code: InterpreterEngineErrorCode): LiveAssistanceCoreErrorCode {
  if (code === "MICROPHONE_UNAVAILABLE") return "MICROPHONE_UNAVAILABLE";
  if (code === "SESSION_EXPIRED") return "SESSION_EXPIRED";
  if (code === "TRANSCRIPTION_FAILED") return "TRANSCRIPT_PARSING_FAILED";
  if (code === "CONNECTION_FAILED") return "NETWORK_DISCONNECTED";
  return "RTC_CONNECTION_FAILED";
}

export function createLiveAssistanceCore({
  sessionService,
  contextClient,
  interpreterEngine,
}: Dependencies): LiveAssistanceCore {
  const listeners = new Set<LiveAssistanceCoreListener>();
  const handledFinals = new Set<string>();
  const recentStatements: string[] = [];
  const turns = new Map<string, StartInterpreterTurnInput>();
  let activeTurnId: string | null = null;
  let credentials: InterpreterSessionCredentials | null = null;
  let sessionInput: { caseId: string; accessToken: string } | null = null;
  let state: LiveAssistanceCoreState = "IDLE";
  let unsubscribeEngine: (() => void) | null = null;
  let stopPromise: Promise<void> | null = null;

  function emit(event: LiveAssistanceCoreEvent) {
    listeners.forEach((listener) => listener(event));
  }

  function setState(nextState: LiveAssistanceCoreState) {
    state = nextState;
    emit({ type: "STATE_CHANGED", state });
  }

  function rememberStatement(statement: string) {
    recentStatements.push(statement);
    if (recentStatements.length > RECENT_STATEMENT_LIMIT) recentStatements.shift();
  }

  async function processAssistance(event: Extract<InterpreterEvent, { type: "TRANSCRIPT_FINAL" | "TRANSLATION_FINAL" }>) {
    const currentCredentials = credentials;
    const currentSessionInput = sessionInput;
    if (!currentCredentials || !currentSessionInput || event.sessionId !== currentCredentials.sessionId) return;

    const key = keyForAssistanceInput(event);
    if (handledFinals.has(key)) return;
    handledFinals.add(key);

    rememberStatement(event.text);
    setState("PROCESSING_CONTEXT");
    emit({ type: "CONTEXT_PROCESSING", sessionId: event.sessionId, turnId: event.turnId });

    try {
      const result = await contextClient.process({
        caseId: currentSessionInput.caseId,
        accessToken: currentSessionInput.accessToken,
        sessionId: currentCredentials.sessionId,
        statement: event.text,
        recentStatements: recentStatements.slice(0, -1),
      });
      if (credentials?.sessionId !== currentCredentials.sessionId) return;
      setState("CONNECTED");
      emit({ type: "ASSISTANCE_FINAL", sessionId: event.sessionId, turnId: event.turnId, result });
    } catch (cause) {
      if (credentials?.sessionId !== currentCredentials.sessionId) return;
      setState("FAILED");
      emit({ type: "ERROR", code: "CONTEXT_PROCESSING_FAILED", message: "Unable to process the incident context.", cause });
    }
  }

  const onEngineEvent: InterpreterEventListener = (event) => {
    const isTextEvent =
      event.type === "TRANSCRIPT_PARTIAL" ||
      event.type === "TRANSCRIPT_FINAL" ||
      event.type === "TRANSLATION_PARTIAL" ||
      event.type === "TRANSLATION_FINAL";

    // Agora can still publish buffered captions after local audio has been
    // muted. They may be decoded for diagnostics, but only an explicitly
    // active microphone turn may affect conversation or Context processing.
    if (isTextEvent && !turns.has(event.turnId)) return;

    emit({ type: "ENGINE_EVENT", event });

    if (event.type === "TOKEN_WILL_EXPIRE") {
      setState("EXPIRED");
      emit({ type: "ERROR", code: "SESSION_EXPIRED", message: "The live assistance token will expire soon." });
      return;
    }

    if (event.type === "ERROR") {
      emit({ type: "ERROR", code: mapEngineError(event.code), message: event.message });
      return;
    }

    if (event.type === "CONNECTION_STATE_CHANGED") {
      if (event.state === "FAILED") {
        setState("FAILED");
        emit({ type: "ERROR", code: "RTC_CONNECTION_FAILED", message: "Unable to connect to live assistance." });
      } else if (event.state === "DISCONNECTED" && credentials) {
        setState("FAILED");
        emit({ type: "ERROR", code: "NETWORK_DISCONNECTED", message: "Live assistance was disconnected." });
      }
      return;
    }

    if (event.type === "TRANSCRIPT_FINAL") {
      // The incident helper is Korean-only: Korean traveler speech is safe to
      // send directly; Japanese police speech waits for Agora's Korean final.
      if (turns.get(event.turnId)?.speakerRole === "TRAVELER") void processAssistance(event);
    }
    if (event.type === "TRANSLATION_FINAL" && turns.get(event.turnId)?.speakerRole === "POLICE_OFFICER") {
      void processAssistance(event);
    }
  };

  async function cleanupEngine(reason: string) {
    console.info("[LiveAssistance][Core] cleanupEngine", {
      reason,
      state,
      hasCredentials: Boolean(credentials),
      hasEngineSubscription: Boolean(unsubscribeEngine),
    });
    const unsubscribe = unsubscribeEngine;
    unsubscribeEngine = null;
    unsubscribe?.();
    await interpreterEngine.disconnect().catch((cause) => {
      logCoreError(`cleanupEngine failed (${reason})`, cause);
    });
  }

  return {
    async startSession(input) {
      if (credentials) {
        console.info("[LiveAssistance][Core] startSession reuse", {
          sessionId: credentials.sessionId,
          state,
        });
        return credentials;
      }

      console.info("[LiveAssistance][Core] startSession begin", {
        caseId: input.caseId,
        state,
      });
      setState("STARTING");
      handledFinals.clear();
      turns.clear();
      activeTurnId = null;
      recentStatements.splice(0, recentStatements.length);

      try {
        console.info("[LiveAssistance][Core] session POST begin");
        const nextCredentials = await sessionService.start(input);
        console.info("[LiveAssistance][Core] session POST success", {
          sessionId: nextCredentials.sessionId,
          uid: nextCredentials.uid,
        });
        credentials = nextCredentials;
        sessionInput = input;
        unsubscribeEngine = interpreterEngine.subscribe(onEngineEvent);
        console.info("[LiveAssistance][Core] interpreterEngine.connect begin", {
          sessionId: nextCredentials.sessionId,
        });
        await interpreterEngine.connect(nextCredentials);
        console.info("[LiveAssistance][Core] interpreterEngine.connect success", {
          sessionId: nextCredentials.sessionId,
        });
        setState("CONNECTED");
        return nextCredentials;
      } catch (cause) {
        logCoreError("startSession failed", cause);
        await cleanupEngine("startSession catch");
        const activeCredentials = credentials;
        credentials = null;
        sessionInput = null;
        if (activeCredentials) {
          console.info("[LiveAssistance][Core] session DELETE from startSession catch", {
            sessionId: activeCredentials.sessionId,
          });
          await sessionService.stop({ caseId: input.caseId, accessToken: input.accessToken, sessionId: activeCredentials.sessionId }).catch((stopCause) => {
            logCoreError("session DELETE after start failure failed", stopCause);
          });
        }
        setState("FAILED");
        emit({ type: "ERROR", code: "SESSION_CREATION_FAILED", message: "Unable to start live assistance.", cause });
        throw cause;
      }
    },

    async stopSession() {
      if (stopPromise) {
        console.info("[LiveAssistance][Core] stopSession reuse in-flight stop");
        return stopPromise;
      }
      const activeCredentials = credentials;
      const activeSessionInput = sessionInput;
      console.info("[LiveAssistance][Core] stopSession begin", {
        state,
        sessionId: activeCredentials?.sessionId ?? null,
      });
      credentials = null;
      sessionInput = null;
      handledFinals.clear();
      turns.clear();
      activeTurnId = null;
      recentStatements.splice(0, recentStatements.length);
      setState("STOPPING");

      stopPromise = (async () => {
        await cleanupEngine("explicit stopSession");
        if (activeCredentials && activeSessionInput) {
          try {
            console.info("[LiveAssistance][Core] session DELETE from stopSession", {
              sessionId: activeCredentials.sessionId,
            });
            await sessionService.stop({ caseId: activeSessionInput.caseId, accessToken: activeSessionInput.accessToken, sessionId: activeCredentials.sessionId });
          } catch (cause) {
            emit({ type: "ERROR", code: "SESSION_CLOSE_FAILED", message: "Unable to close live assistance.", cause });
            throw cause;
          }
        }
        setState("IDLE");
      })().finally(() => { stopPromise = null; });

      return stopPromise;
    },

    async setMicrophoneEnabled({ enabled, turn }) {
      if (enabled) {
        if (!turn) throw new Error("A turn is required when enabling the microphone.");
        turns.set(turn.turnId, turn);
        activeTurnId = turn.turnId;
        try {
          await interpreterEngine.startTurn(turn);
        } catch (error) {
          turns.delete(turn.turnId);
          activeTurnId = null;
          throw error;
        }
        return;
      }
      await interpreterEngine.muteTurn();
    },

    async completeTurn(turnId) {
      if (activeTurnId !== turnId) return;
      activeTurnId = null;
      turns.delete(turnId);
      await interpreterEngine.stopTurn();
    },

    getCredentials: () => credentials,
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
