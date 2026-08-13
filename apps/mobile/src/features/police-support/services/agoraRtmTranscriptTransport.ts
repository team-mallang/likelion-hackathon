import { parseAgoraUserTranscript } from "@project/shared";

import type {
  BackendInterpreterMessage,
  InterpreterTranscriptTransport,
} from "@/features/police-support/services/interpreterTranscriptTransport";
import type { StartInterpreterTurnInput } from "@/features/police-support/services/interpreterEngine.types";
import type { InterpreterSessionCredentials } from "@/features/police-support/types/policeSupport";

/**
 * Small adapter over an RTM v2 native bridge. The bridge must use the server
 * issued token; it must not receive an App Certificate or customer secret.
 */
export type AgoraRtmNativeClient = {
  login(input: { appId: string; userId: string; token: string }): Promise<void>;
  subscribe(channelName: string): Promise<void>;
  unsubscribe(channelName: string): Promise<void>;
  renewToken(token: string): Promise<void>;
  logout(): Promise<void>;
  onMessage(listener: (event: { channelName: string; message: string }) => void): () => void;
  onError?(listener: (event: { operation: string; code: string; message: string }) => void): () => void;
};

export function createAgoraRtmTranscriptTransport(client: AgoraRtmNativeClient): InterpreterTranscriptTransport {
  let unsubscribeMessage: (() => void) | null = null;
  let credentials: InterpreterSessionCredentials | null = null;
  let onMessage: ((message: BackendInterpreterMessage) => void) | null = null;
  let activeTurn: StartInterpreterTurnInput | null = null;
  let sequence = 0;

  function reset() {
    unsubscribeMessage?.();
    unsubscribeMessage = null;
    credentials = null;
    onMessage = null;
    activeTurn = null;
    sequence = 0;
  }

  return {
    async connect(input) {
      if (credentials) return;
      credentials = input.credentials;
      onMessage = input.onMessage;
      try {
        await client.login({ appId: credentials.appId, userId: credentials.rtmUserId, token: credentials.rtmToken });
        await client.subscribe(credentials.channelName);
        unsubscribeMessage = client.onMessage((event) => {
          if (event.channelName !== credentials?.channelName) return;
          const transcript = parseAgoraUserTranscript(event.message);
          if (!transcript) return;

          // ARES can send agent events over the same RTM subscription. The
          // shared parser rejects those; only a currently user-opened turn is
          // allowed to become a mobile interpreter event.
          const turnId = transcript.turnId ?? activeTurn?.turnId;
          if (!turnId || !credentials || !onMessage) return;
          sequence += 1;
          onMessage({
            type: transcript.isFinal ? "transcript.final" : "transcript.partial",
            sessionId: credentials.sessionId,
            turnId,
            sequence,
            text: transcript.text,
          });
        });
        const unsubscribeError = client.onError?.((event) => {
          if (!credentials || !onMessage) return;
          onMessage({ type: "error", sessionId: credentials.sessionId, turnId: activeTurn?.turnId ?? null, code: "CONNECTION_FAILED", message: event.message });
        });
        const previousUnsubscribe = unsubscribeMessage;
        unsubscribeMessage = () => { previousUnsubscribe?.(); unsubscribeError?.(); };
      } catch (error) {
        await client.logout().catch(() => undefined);
        reset();
        throw error;
      }
    },

    async startTurn(input) {
      activeTurn = input;
    },

    async stopTurn(turnId) {
      if (activeTurn?.turnId === turnId) activeTurn = null;
    },

    async renewCredentials(nextCredentials) {
      if (!credentials || nextCredentials.sessionId !== credentials.sessionId) {
        throw new Error("RTM credentials do not match the active live assistance session.");
      }
      await client.renewToken(nextCredentials.rtmToken);
      credentials = nextCredentials;
    },

    async disconnect() {
      try {
        if (credentials?.channelName) await client.unsubscribe(credentials.channelName).catch(() => undefined);
        await client.logout();
      } finally {
        reset();
      }
    },
  };
}
