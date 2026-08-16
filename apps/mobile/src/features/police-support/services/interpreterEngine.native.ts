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

  function emit(event: InterpreterEvent) {
    listeners.forEach((listener) => listener(event));
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
      onJoinChannelSuccess() {
        connecting = false;
        connected = true;
        emit({ type: "CONNECTION_STATE_CHANGED", state: "CONNECTED" });
        settleConnection?.resolve();
        settleConnection = null;
      },
      onConnectionStateChanged(_connection, state) {
        const normalizedState = mapConnectionState(state);
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
      onError() {
        const error = new InterpreterEngineError(
          "CONNECTION_FAILED",
          "실시간 통역 중 네이티브 오디오 오류가 발생했습니다.",
        );
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
    };
  }

  async function releaseResources() {
    const currentEngine = engine;
    const currentHandler = eventHandler;
    engine = null;
    eventHandler = null;
    connected = false;
    connecting = false;
    activeTurn = null;
    settleConnection?.reject(
      new InterpreterEngineError(
        "CONNECTION_FAILED",
        "실시간 통역 연결이 종료되었습니다.",
      ),
    );
    settleConnection = null;

    if (transportConnected) {
      transportConnected = false;
      await transcriptTransport.disconnect().catch(() => {
        // The server session TTL remains the final cleanup fallback.
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
        return;
      }

      if (connecting) {
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
      emit({ type: "CONNECTION_STATE_CHANGED", state: "CONNECTING" });

      try {
        const nextEngine = createAgoraRtcEngine();
        assertResult(
          nextEngine.initialize({
            appId: nextCredentials.appId,
            channelProfile: ChannelProfileType.ChannelProfileCommunication,
          }),
          "실시간 통역 엔진을 초기화하지 못했습니다.",
        );
        engine = nextEngine;

        eventHandler = createEventHandler();

        if (!engine.registerEventHandler(eventHandler)) {
          throw new InterpreterEngineError(
            "CONNECTION_FAILED",
            "통역 연결 이벤트를 등록하지 못했습니다.",
          );
        }

        assertResult(
          engine.enableAudio(),
          "오디오 기능을 활성화하지 못했습니다.",
          "MICROPHONE_UNAVAILABLE",
        );
        assertResult(
          engine.muteLocalAudioStream(true),
          "마이크 전송을 준비하지 못했습니다.",
          "MICROPHONE_UNAVAILABLE",
        );

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

        const connectionPromise = new Promise<void>((resolve, reject) => {
          settleConnection = { resolve, reject };
        });

        assertResult(
          engine.joinChannel(
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
          ),
          "실시간 통역 채널에 참여하지 못했습니다.",
        );

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
        await releaseResources();
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
      await releaseResources();
      emit({ type: "CONNECTION_STATE_CHANGED", state: "DISCONNECTED" });
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
