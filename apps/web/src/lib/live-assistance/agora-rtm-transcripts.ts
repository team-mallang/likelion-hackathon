export type AgoraTranscript = { text: string; final: boolean; startMs?: number; latencyMs?: number };

export type AgoraRtmTranscriptSession = { disconnect(): Promise<void> };

export async function connectAgoraRtmTranscripts(input: {
  appId: string;
  rtmUserId: string;
  rtmToken: string;
  channel: string;
  onState: (state: "CONNECTED" | "DISCONNECTED" | "FAILED") => void;
  onTranscript: (transcript: AgoraTranscript) => void;
}): Promise<AgoraRtmTranscriptSession> {
  const module = await import("agora-rtm-sdk");
  const RTM = module.default.RTM as unknown as new (appId: string, userId: string) => {
    login: (options: { token: string }) => Promise<void>;
    subscribe: (channel: string) => Promise<void>;
    logout: () => Promise<void>;
    addEventListener: (event: string, listener: (event: { message?: string | Uint8Array; channelName?: string }) => void) => void;
  };
  const client = new RTM(input.appId, input.rtmUserId);
  client.addEventListener("message", (event) => {
    if (event.channelName !== input.channel || typeof event.message !== "string") return;
    try {
      const message = parseAgoraUserTranscript(event.message);
      if (!message) return;
      const now = Date.now();
      // Agora may omit start_ms or use 0 for this event. Only show a latency
      // when it is a plausible epoch-millisecond timestamp.
      const latencyMs = typeof message.startMs === "number" && message.startMs > 1_000_000_000_000 && message.startMs <= now
        ? now - message.startMs
        : undefined;
      input.onTranscript({ text: message.text, final: message.isFinal, startMs: message.startMs ?? undefined, latencyMs });
    } catch { /* non-transcript RTM messages are expected */ }
  });
  try {
    await client.login({ token: input.rtmToken });
    await client.subscribe(input.channel);
    input.onState("CONNECTED");
  } catch (error) {
    input.onState("FAILED");
    await client.logout().catch(() => undefined);
    throw error;
  }
  return { async disconnect() { await client.logout().catch(() => undefined); input.onState("DISCONNECTED"); } };
}
import { parseAgoraUserTranscript } from "@project/shared";
