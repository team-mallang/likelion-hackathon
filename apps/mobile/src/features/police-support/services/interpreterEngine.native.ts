import {
  ChannelProfileType,
  ClientRoleType,
  ConnectionStateType,
  createAgoraRtcEngine,
  type IRtcEngine,
  type IRtcEngineEventHandler,
} from "react-native-agora";

import {
  InterpreterEngineError,
  type InterpreterConnectionState,
  type InterpreterEngine,
  type InterpreterEvent,
  type InterpreterEventListener,
  type StartInterpreterTurnInput,
} from "@/features/police-support/services/interpreterEngine.types";
import {
  normalizeBackendInterpreterMessage,
  type InterpreterTranscriptTransport,
} from "@/features/police-support/services/interpreterTranscriptTransport";
import { createAgoraSttJsonAssembler, inspectAgoraSttPayload } from "@/features/police-support/services/agoraSttJsonProtocol";
import type { InterpreterSessionCredentials } from "@/features/police-support/types/policeSupport";

export * from "@/features/police-support/services/interpreterEngine.types";

export type NativeInterpreterEngineOptions = {
  transcriptTransport: InterpreterTranscriptTransport;
  connectionTimeoutMs?: number;
};

const DEFAULT_CONNECTION_TIMEOUT_MS = 15_000;

export function createNativeInterpreterEngine({
  transcriptTransport,
  connectionTimeoutMs = DEFAULT_CONNECTION_TIMEOUT_MS,
}: NativeInterpreterEngineOptions): InterpreterEngine {
  const listeners = new Set<InterpreterEventListener>();
  let engine: IRtcEngine | null = null;
  let eventHandler: IRtcEngineEventHandler | null = null;
  let credentials: InterpreterSessionCredentials | null = null;
  let activeTurn: StartInterpreterTurnInput | null = null;
  let transportConnected = false;
  let connected = false;
  let connecting = false;
  let settleConnection:
    | { resolve: () => void; reject: (error: Error) => void }
    | null = null;
  const sttAssembler = createAgoraSttJsonAssembler();

  function emit(event: InterpreterEvent) {
    listeners.forEach((listener) => listener(event));
  }

  function logError(scope: string, error: unknown, details?: object) {
    const normalized =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : { error };
    console.error(`[LiveAssistance][RTC] ${scope}`, {
      ...details,
      ...normalized,
    });
  }

  function assertResult(
    result: number,
    message: string,
    code: "CONNECTION_FAILED" | "MICROPHONE_UNAVAILABLE" =
      "CONNECTION_FAILED",
  ) {
    if (result < 0) {
      throw new InterpreterEngineError(code, message);
    }
  }

  function mapConnectionState(
    state: ConnectionStateType,
  ): InterpreterConnectionState {
    switch (state) {
      case ConnectionStateType.ConnectionStateConnecting:
        return "CONNECTING";
      case ConnectionStateType.ConnectionStateConnected:
        return "CONNECTED";
      case ConnectionStateType.ConnectionStateReconnecting:
        return "RECONNECTING";
      case ConnectionStateType.ConnectionStateFailed:
        return "FAILED";
      default:
        return "DISCONNECTED";
    }
  }

  function createEventHandler(): IRtcEngineEventHandler {
    return {
      onJoinChannelSuccess(connection, elapsed) {
        console.info("[LiveAssistance][RTC] onJoinChannelSuccess", {
          channelId: connection.channelId,
          localUid: connection.localUid,
          elapsed,
        });
        connecting = false;
        connected = true;
        emit({ type: "CONNECTION_STATE_CHANGED", state: "CONNECTED" });
        settleConnection?.resolve();
        settleConnection = null;
      },
      onConnectionStateChanged(_connection, state) {
        const normalizedState = mapConnectionState(state);
        console.info("[LiveAssistance][RTC] onConnectionStateChanged", {
          state,
          normalizedState,
          connecting,
        });
        connected = normalizedState === "CONNECTED";
        emit({ type: "CONNECTION_STATE_CHANGED", state: normalizedState });

        if (
          normalizedState === "FAILED" ||
          (normalizedState === "DISCONNECTED" && connecting)
        ) {
          connecting = false;
          settleConnection?.reject(
            new InterpreterEngineError(
              "CONNECTION_FAILED",
              "실시간 통역 채널에 연결하지 못했습니다.",
            ),
          );
          settleConnection = null;
        }
      },
      onTokenPrivilegeWillExpire() {
        if (!credentials) {
          return;
        }

        emit({
          type: "TOKEN_WILL_EXPIRE",
          sessionId: credentials.sessionId,
          expiresAt: credentials.expiresAt,
        });
      },
      onPermissionError() {
        emit({
          type: "ERROR",
          sessionId: credentials?.sessionId ?? null,
          turnId: activeTurn?.turnId ?? null,
          code: "MICROPHONE_UNAVAILABLE",
          message: "마이크 권한을 확인하지 못했습니다.",
        });
      },
      onError(errorCode, message) {
        const error = new InterpreterEngineError(
          "CONNECTION_FAILED",
          "실시간 통역 중 네이티브 오디오 오류가 발생했습니다.",
        );
        logError("native onError", error, { errorCode, nativeMessage: message });
        settleConnection?.reject(error);
        settleConnection = null;
        emit({
          type: "ERROR",
          sessionId: credentials?.sessionId ?? null,
          turnId: activeTurn?.turnId ?? null,
          code: error.code,
          message: error.message,
        });
      },
      onStreamMessage(_connection, remoteUid, _streamId, data) {
        // Agora STT Translation publishes captions from its pub bot. Do not
        // accept arbitrary stream messages as transcripts.
        if (!credentials || String(remoteUid) !== credentials.agentRtcUid) return;
        const debug = inspectAgoraSttPayload(data);
        try {
          const events = sttAssembler.parse(data, credentials.sessionId);
          events.forEach((event) => {
            if (event.type === "TRANSCRIPT_FINAL" || event.type === "TRANSLATION_FINAL") {
              console.info(`[LiveAssistance][STT_${event.type}]`, {
                remoteUid,
                sessionId: event.sessionId,
                turnId: event.turnId,
                sequence: event.sequence,
              });
            }
            emit(event);
          });
        } catch (cause) {
          // A data-stream message can be malformed or use an unsupported
          // upstream variant. Dropping one message must not interrupt RTC,
          // the active turn, or the whole interpretation session.
          console.warn("[LiveAssistance][STT_MESSAGE_DROPPED]", {
            remoteUid,
            branch: debug.branch,
            byteLength: debug.length,
            error: cause instanceof Error ? cause.name : "unknown",
          });
        }
      },
    };
  }

  async function releaseResources(reason: string) {
    console.info("[LiveAssistance][RTC] releaseResources", {
      reason,
      hasEngine: Boolean(engine),
      hasEventHandler: Boolean(eventHandler),
      transportConnected,
      connected,
      connecting,
      sessionId: credentials?.sessionId ?? null,
    });
    const currentEngine = engine;
    const currentHandler = eventHandler;
    engine = null;
    eventHandler = null;
    connected = false;
    connecting = false;
    activeTurn = null;
    sttAssembler.clearTurn();
    settleConnection?.reject(
      new InterpreterEngineError(
        "CONNECTION_FAILED",
        "실시간 통역 연결이 종료되었습니다.",
      ),
    );
    settleConnection = null;

    if (transportConnected) {
      transportConnected = false;
      await transcriptTransport.disconnect().catch((error) => {
        logError("transcript transport disconnect failed", error, { reason });
      });
    }

    if (currentEngine) {
      currentEngine.muteLocalAudioStream(true);

      if (currentHandler) {
        currentEngine.unregisterEventHandler(currentHandler);
      }

      currentEngine.leaveChannel();
      currentEngine.release();
    }

    credentials = null;
  }

  return {
    async connect(nextCredentials) {
      if (connected) {
        console.info("[LiveAssistance][RTC] connect skipped: already connected", {
          sessionId: credentials?.sessionId ?? null,
        });
        return;
      }

      if (connecting) {
        console.info("[LiveAssistance][RTC] connect rejected: already connecting", {
          sessionId: credentials?.sessionId ?? null,
        });
        throw new InterpreterEngineError(
          "CONNECTION_FAILED",
          "실시간 통역 연결이 이미 진행 중입니다.",
        );
      }

      if (
        !nextCredentials.appId.trim() ||
        !nextCredentials.channelName.trim() ||
        !nextCredentials.rtcToken.trim()
      ) {
        throw new InterpreterEngineError(
          "INVALID_SESSION",
          "통역 세션 자격정보가 올바르지 않습니다.",
        );
      }

      if (new Date(nextCredentials.expiresAt).getTime() <= Date.now()) {
        throw new InterpreterEngineError(
          "SESSION_EXPIRED",
          "통역 세션이 만료되었습니다.",
        );
      }

      connecting = true;
      credentials = nextCredentials;
      let stage = "rtc-engine-create";
      console.info("[LiveAssistance][RTC] connect begin", {
        sessionId: nextCredentials.sessionId,
        channelName: nextCredentials.channelName,
        uid: nextCredentials.uid,
        rtmUserId: nextCredentials.rtmUserId,
      });
      emit({ type: "CONNECTION_STATE_CHANGED", state: "CONNECTING" });

      try {
        const nextEngine = createAgoraRtcEngine();
        stage = "rtc-initialize";
        console.info("[LiveAssistance][RTC] initialize begin");
        const initializeResult = nextEngine.initialize({
          appId: nextCredentials.appId,
          channelProfile: ChannelProfileType.ChannelProfileCommunication,
        });
        console.info("[LiveAssistance][RTC] initialize result", {
          result: initializeResult,
        });
        assertResult(
          initializeResult,
          "실시간 통역 엔진을 초기화하지 못했습니다.",
        );
        engine = nextEngine;

        stage = "rtc-register-event-handler";
        eventHandler = createEventHandler();

        const registered = engine.registerEventHandler(eventHandler);
        console.info("[LiveAssistance][RTC] registerEventHandler result", {
          registered,
        });
        // Agora returns 0 when registration succeeds. Some wrapper versions
        // expose no return value, so only a non-zero numeric status is an
        // explicit failure. Do not use a truthiness check here.
        if (typeof registered === "number" && registered !== 0) {
          throw new InterpreterEngineError(
            "CONNECTION_FAILED",
            "통역 연결 이벤트를 등록하지 못했습니다.",
          );
        }

        stage = "rtc-enable-audio";
        const enableAudioResult = engine.enableAudio();
        console.info("[LiveAssistance][RTC] enableAudio result", {
          result: enableAudioResult,
        });
        assertResult(
          enableAudioResult,
          "오디오 기능을 활성화하지 못했습니다.",
          "MICROPHONE_UNAVAILABLE",
        );
        stage = "rtc-mute-before-join";
        const muteResult = engine.muteLocalAudioStream(true);
        console.info("[LiveAssistance][RTC] mute before join result", {
          result: muteResult,
        });
        assertResult(
          muteResult,
          "마이크 전송을 준비하지 못했습니다.",
          "MICROPHONE_UNAVAILABLE",
        );

        stage = "rtm-connect";
        console.info("[LiveAssistance][RTC] RTM connect begin", {
          sessionId: nextCredentials.sessionId,
        });
        await transcriptTransport.connect({
          credentials: nextCredentials,
          onMessage(message) {
            const event = normalizeBackendInterpreterMessage(message);

            if (
              event &&
              "sessionId" in event &&
              event.sessionId === credentials?.sessionId
            ) {
              emit(event);
            }
          },
        });
        transportConnected = true;
        console.info("[LiveAssistance][RTC] RTM connect success", {
          sessionId: nextCredentials.sessionId,
        });

        stage = "rtc-join-promise-create";
        const connectionPromise = new Promise<void>((resolve, reject) => {
          settleConnection = { resolve, reject };
        });

        stage = "rtc-join-channel";
        console.info("[LiveAssistance][RTC] joinChannel begin", {
          sessionId: nextCredentials.sessionId,
          channelName: nextCredentials.channelName,
          uid: nextCredentials.uid,
        });
        const joinResult = engine.joinChannel(
          nextCredentials.rtcToken,
          nextCredentials.channelName,
          nextCredentials.uid,
          {
            publishMicrophoneTrack: true,
            autoSubscribeAudio: false,
            autoSubscribeVideo: false,
            enableAudioRecordingOrPlayout: true,
            clientRoleType: ClientRoleType.ClientRoleBroadcaster,
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
          },
        );
        console.info("[LiveAssistance][RTC] joinChannel result", {
          result: joinResult,
        });
        assertResult(
          joinResult,
          "실시간 통역 채널에 참여하지 못했습니다.",
        );

        stage = "rtc-wait-for-onJoinChannelSuccess";
        let timeout: ReturnType<typeof setTimeout> | undefined;
        await Promise.race([
          connectionPromise,
          new Promise<never>((_, reject) => {
            timeout = setTimeout(
              () =>
                reject(
                  new InterpreterEngineError(
                    "CONNECTION_FAILED",
                    "실시간 통역 연결 시간이 초과되었습니다.",
                  ),
                ),
              Math.max(1_000, connectionTimeoutMs),
            );
          }),
        ]).finally(() => {
          if (timeout) {
            clearTimeout(timeout);
          }
        });
      } catch (error) {
        logError("connect failed", error, {
          stage,
          sessionId: nextCredentials.sessionId,
        });
        await releaseResources(`connect catch at ${stage}`);
        emit({ type: "CONNECTION_STATE_CHANGED", state: "FAILED" });
        throw error instanceof InterpreterEngineError
          ? error
          : new InterpreterEngineError(
              "CONNECTION_FAILED",
              "실시간 통역에 연결하지 못했습니다.",
            );
      }
    },

    async startTurn(input) {
      if (!engine || !credentials || !connected) {
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

      await transcriptTransport.startTurn(input);

      try {
        assertResult(
          engine.muteLocalAudioStream(false),
          "마이크 음성을 전송하지 못했습니다.",
          "MICROPHONE_UNAVAILABLE",
        );
        activeTurn = input;
        sttAssembler.setTurn(input);
        console.info("[LiveAssistance][RTC] TURN_STARTED", {
          turnId: input.turnId,
        });
      } catch (error) {
        await transcriptTransport.stopTurn(input.turnId).catch(() => {});
        throw error;
      }
    },

    async stopTurn() {
      if (!engine || !credentials || !connected) {
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
      activeTurn = null;
      sttAssembler.clearTurn(completedTurn.turnId);
      let microphoneError: InterpreterEngineError | null = null;

      try {
        assertResult(
          engine.muteLocalAudioStream(true),
          "마이크 음성 전송을 중지하지 못했습니다.",
          "MICROPHONE_UNAVAILABLE",
        );
      } catch (error) {
        microphoneError =
          error instanceof InterpreterEngineError
            ? error
            : new InterpreterEngineError(
                "MICROPHONE_UNAVAILABLE",
                "마이크 음성 전송을 중지하지 못했습니다.",
              );
      }

      try {
        await transcriptTransport.stopTurn(completedTurn.turnId);
        emit({
          type: "TURN_STOPPED",
          sessionId: credentials.sessionId,
          turnId: completedTurn.turnId,
        });
        console.info("[LiveAssistance][RTC] TURN_STOPPED", {
          turnId: completedTurn.turnId,
        });

        if (microphoneError) {
          throw microphoneError;
        }
      } catch {
        const error =
          microphoneError ??
          new InterpreterEngineError(
            "TRANSCRIPTION_FAILED",
            "발화의 문자 변환을 종료하지 못했습니다.",
          );
        emit({
          type: "ERROR",
          sessionId: credentials.sessionId,
          turnId: completedTurn.turnId,
          code: error.code,
          message: error.message,
        });
        throw error;
      }
    },

    async renewCredentials(nextCredentials) {
      if (!engine || !credentials || !connected) {
        throw new InterpreterEngineError(
          "NOT_CONNECTED",
          "갱신할 통역 세션이 없습니다.",
        );
      }

      if (
        nextCredentials.sessionId !== credentials.sessionId ||
        nextCredentials.appId !== credentials.appId ||
        nextCredentials.channelName !== credentials.channelName ||
        nextCredentials.uid !== credentials.uid ||
        new Date(nextCredentials.expiresAt).getTime() <= Date.now()
      ) {
        throw new InterpreterEngineError(
          "INVALID_SESSION",
          "갱신된 통역 세션 정보가 기존 채널과 일치하지 않습니다.",
        );
      }

      assertResult(
        engine.renewToken(nextCredentials.rtcToken),
        "통역 연결 토큰을 갱신하지 못했습니다.",
      );
      await transcriptTransport.renewCredentials(nextCredentials);
      credentials = nextCredentials;
    },

    async disconnect() {
      await releaseResources("disconnect called");
      emit({ type: "CONNECTION_STATE_CHANGED", state: "DISCONNECTED" });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
