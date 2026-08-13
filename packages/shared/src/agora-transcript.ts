export type AgoraUserTranscript = {
  text: string;
  isFinal: boolean;
  turnId: string | null;
  startMs: number | null;
};

type AgoraTranscriptPayload = {
  object?: unknown;
  text?: unknown;
  final?: unknown;
  start_ms?: unknown;
  turn_id?: unknown;
  id?: unknown;
};

/**
 * Parses the ARES RTM payload observed in the working Chrome PoC.
 * Only `user.transcription` is accepted so agent speech can never trigger
 * incident-context processing on a client.
 */
export function parseAgoraUserTranscript(payload: unknown): AgoraUserTranscript | null {
  if (typeof payload !== "string") return null;

  let message: AgoraTranscriptPayload;
  try {
    message = JSON.parse(payload) as AgoraTranscriptPayload;
  } catch {
    return null;
  }

  if (message.object !== "user.transcription" || typeof message.text !== "string") {
    return null;
  }

  const text = message.text.trim();
  if (!text) return null;

  return {
    text,
    isFinal: message.final === true,
    turnId: typeof message.turn_id === "string"
      ? message.turn_id
      : typeof message.id === "string"
        ? message.id
        : null,
    startMs: typeof message.start_ms === "number" ? message.start_ms : null,
  };
}
