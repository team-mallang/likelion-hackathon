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
    async connect() {}, async startTurn() {}, async muteTurn() {}, async stopTurn() {}, async renewCredentials() {}, async disconnect() {},
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
  core.subscribe((event) => { if (event.type === "ASSISTANCE_FINAL") results.push(event.result.incidentHelp); });

  await core.startSession({ caseId: "case_1", accessToken: "token" });
  await core.setMicrophoneEnabled({ enabled: true, turn: { turnId: "turn_1", speakerRole: "TRAVELER", sourceLanguage: "ko-KR", targetLanguage: "ja-JP" } });
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

test("Live Assistance Core drains final events after mute and ignores them after completion", async () => {
  const { engine, emit } = createEngine();
  const calls: string[] = [];
  const core = createLiveAssistanceCore({
    interpreterEngine: engine,
    sessionService: { async start() { return credentials; }, async stop() {} },
    contextClient: { async process(input) { calls.push(input.statement); return { mode: "RULE", incidentHelp: "ok", elapsedMs: 1, ai: null }; } },
  });
  const visibleEvents: string[] = [];
  core.subscribe((event) => {
    if (event.type === "ENGINE_EVENT" && (event.event.type === "TRANSCRIPT_FINAL" || event.event.type === "TRANSLATION_FINAL")) visibleEvents.push(event.event.type);
  });

  await core.startSession({ caseId: "case_1", accessToken: "token" });
  await core.setMicrophoneEnabled({ enabled: true, turn: { turnId: "turn_1", speakerRole: "TRAVELER", sourceLanguage: "ko-KR", targetLanguage: "ja-JP" } });
  await core.setMicrophoneEnabled({ enabled: false });
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "turn_1", sequence: 1, text: "late" });
  emit({ type: "TRANSLATION_FINAL", sessionId: "live_1", turnId: "turn_1", sequence: 2, text: "late" });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(visibleEvents, ["TRANSCRIPT_FINAL", "TRANSLATION_FINAL"]);
  assert.deepEqual(calls, ["late"]);

  await core.completeTurn("turn_1");
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "turn_1", sequence: 3, text: "ignored" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, ["late"]);
});

test("Live Assistance Core sends police speech to Context only after Korean translation", async () => {
  const { engine, emit } = createEngine();
  const calls: string[] = [];
  const core = createLiveAssistanceCore({
    interpreterEngine: engine,
    sessionService: { async start() { return credentials; }, async stop() {} },
    contextClient: { async process(input) { calls.push(input.statement); return { mode: "RULE", incidentHelp: "ok", elapsedMs: 1, ai: null }; } },
  });
  await core.startSession({ caseId: "case_1", accessToken: "token" });
  await core.setMicrophoneEnabled({ enabled: true, turn: { turnId: "police-1", speakerRole: "POLICE_OFFICER", sourceLanguage: "ja-JP", targetLanguage: "ko-KR" } });
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "police-1", sequence: 1, text: "일본어 원문" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, []);
  emit({ type: "TRANSLATION_FINAL", sessionId: "live_1", turnId: "police-1", sequence: 2, text: "한국어 번역" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.deepEqual(calls, ["한국어 번역"]);
});

test("Live Assistance Core requests Context for every distinct final sentence in one turn", async () => {
  const { engine, emit } = createEngine();
  const calls: string[] = [];
  const core = createLiveAssistanceCore({
    interpreterEngine: engine,
    sessionService: { async start() { return credentials; }, async stop() {} },
    contextClient: { async process(input) { calls.push(input.statement); return { mode: "RULE", incidentHelp: "ok", elapsedMs: 1, ai: null }; } },
  });

  await core.startSession({ caseId: "case_1", accessToken: "token" });
  await core.setMicrophoneEnabled({ enabled: true, turn: { turnId: "turn_1", speakerRole: "TRAVELER", sourceLanguage: "ko-KR", targetLanguage: "ja-JP" } });
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "turn_1", sentenceId: "one", sequence: 1, text: "first" });
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "turn_1", sentenceId: "two", sequence: 2, text: "second" });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(calls, ["first", "second"]);
});

test("Live Assistance Core keeps RTC session connected when Context processing fails", async () => {
  const { engine, emit } = createEngine();
  let disconnectCalls = 0;
  engine.disconnect = async () => { disconnectCalls += 1; };
  const errors: string[] = [];
  const core = createLiveAssistanceCore({
    interpreterEngine: engine,
    sessionService: { async start() { return credentials; }, async stop() {} },
    contextClient: { async process() { throw new Error("OpenAI request failed"); } },
  });
  core.subscribe((event) => { if (event.type === "ERROR") errors.push(event.code); });

  await core.startSession({ caseId: "case_1", accessToken: "token" });
  await core.setMicrophoneEnabled({ enabled: true, turn: { turnId: "turn_1", speakerRole: "TRAVELER", sourceLanguage: "ko-KR", targetLanguage: "ja-JP" } });
  emit({ type: "TRANSCRIPT_FINAL", sessionId: "live_1", turnId: "turn_1", sequence: 1, text: "context failure" });
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.deepEqual(errors, ["CONTEXT_PROCESSING_FAILED"]);
  assert.equal(core.getState(), "CONNECTED");
  assert.equal(core.getCredentials()?.sessionId, "live_1");
  assert.equal(disconnectCalls, 0);
});
