import assert from "node:assert/strict";
import test from "node:test";

import { createLiveAssistanceCore } from "./liveAssistanceCore";
import type { InterpreterEngine, InterpreterEventListener } from "./interpreterEngine";
import type { InterpreterSessionCredentials } from "../types/policeSupport";

const credentials: InterpreterSessionCredentials = {
  sessionId: "live_1", appId: "app", channelName: "channel", uid: 1,
  rtcToken: "rtc", rtmToken: "rtm", rtmUserId: "user", agentId: "agent", agentRtcUid: "2",
  expiresAt: new Date(Date.now() + 60_000).toISOString(), transcriptionTaskId: "agent",
  sourceLanguages: ["ko-KR", "ja-JP"], targetLanguages: ["ko-KR", "ja-JP"],
};

function createEngine() {
  const listeners = new Set<InterpreterEventListener>();
  const engine: InterpreterEngine = {
    async connect() {}, async startTurn() {}, async stopTurn() {}, async renewCredentials() {}, async disconnect() {},
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
  };
  return { engine, emit(event: Parameters<InterpreterEventListener>[0]) { listeners.forEach((listener) => listener(event)); } };
}

test("Live Assistance Core sends only a deduplicated final transcript to Context", async () => {
  const { engine, emit } = createEngine();
  const calls: string[] = [];
  const core = createLiveAssistanceCore({
    interpreterEngine: engine,
    sessionService: { async start() { return credentials; }, async stop() {} },
    contextClient: { async process(input) { calls.push(input.statement); return { mode: "RULE", incidentHelp: "검정색", elapsedMs: 1, ai: null }; } },
  });
  const results: string[] = [];
  core.subscribe((event) => { if (event.type === "CONTEXT_RESULT") results.push(event.result.incidentHelp); });

  await core.startSession({ caseId: "case_1", accessToken: "token" });
  emit({ type: "TRANSCRIPT_PARTIAL", sessionId: "live_1", turnId: "turn_1", sequence: 1, text: "지갑 색상" });
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "turn_1", sequence: 2, text: "지갑 색상은 무엇인가요?" });
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "turn_1", sequence: 2, text: "지갑 색상은 무엇인가요?" });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(calls, ["지갑 색상은 무엇인가요?"]);
  assert.deepEqual(results, ["검정색"]);
});

test("Live Assistance Core closes the server session when engine connection fails", async () => {
  const { engine } = createEngine();
  engine.connect = async () => { throw new Error("RTM connect failed"); };
  let stopped = false;
  const core = createLiveAssistanceCore({
    interpreterEngine: engine,
    sessionService: { async start() { return credentials; }, async stop() { stopped = true; } },
    contextClient: { async process() { throw new Error("not used"); } },
  });

  await assert.rejects(() => core.startSession({ caseId: "case_1", accessToken: "token" }));
  assert.equal(stopped, true);
  assert.equal(core.getCredentials(), null);
});
