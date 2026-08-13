import assert from "node:assert/strict";
import test from "node:test";

import { createAgoraRtmTranscriptTransport, type AgoraRtmNativeClient } from "./agoraRtmTranscriptTransport";
import type { InterpreterSessionCredentials } from "../types/policeSupport";

const credentials: InterpreterSessionCredentials = {
  sessionId: "live_1", appId: "app", channelName: "channel", uid: 1,
  rtcToken: "rtc", rtmToken: "rtm", rtmUserId: "user", agentId: "agent", agentRtcUid: "2",
  expiresAt: new Date(Date.now() + 60_000).toISOString(), transcriptionTaskId: "agent",
  sourceLanguages: ["ko-KR", "ja-JP"], targetLanguages: ["ko-KR", "ja-JP"],
};

test("RTM transport forwards only user transcript payloads and preserves final events", async () => {
  let listener: (event: { channelName: string; message: string }) => void = () => {};
  let renewedToken: string | null = null;
  let unsubscribedChannel: string | null = null;
  const client: AgoraRtmNativeClient = {
    async login() {}, async subscribe() {}, async unsubscribe(channelName) { unsubscribedChannel = channelName; }, async renewToken(token) { renewedToken = token; }, async logout() {},
    onMessage(nextListener) { listener = nextListener; return () => { listener = () => {}; }; },
  };
  const transport = createAgoraRtmTranscriptTransport(client);
  const messages: unknown[] = [];
  await transport.connect({ credentials, onMessage(message) { messages.push(message); } });
  await transport.startTurn({ turnId: "turn_1", speakerRole: "TRAVELER", sourceLanguage: "ko-KR", targetLanguage: "ja-JP" });
  listener({ channelName: "channel", message: JSON.stringify({ object: "agent.transcription", text: "ignore", final: true }) });
  listener({ channelName: "channel", message: JSON.stringify({ object: "user.transcription", text: " 지갑 색상은 무엇인가요? ", final: false }) });
  await transport.stopTurn("turn_1");
  listener({ channelName: "channel", message: JSON.stringify({ object: "user.transcription", text: "지갑 색상은 무엇인가요?", final: true }) });

  assert.deepEqual(messages, [
    { type: "transcript.partial", sessionId: "live_1", turnId: "turn_1", sequence: 1, text: "지갑 색상은 무엇인가요?" },
    { type: "transcript.final", sessionId: "live_1", turnId: "turn_1", sequence: 2, text: "지갑 색상은 무엇인가요?" },
  ]);

  await transport.renewCredentials({ ...credentials, rtmToken: "rtm-renewed" });
  await transport.disconnect();
  assert.equal(renewedToken, "rtm-renewed");
  assert.equal(unsubscribedChannel, "channel");
});
