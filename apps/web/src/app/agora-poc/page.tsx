"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { joinAgoraAudioChannel, type AgoraBrowserSession } from "@/lib/live-assistance/agora-browser";
import { connectAgoraRtmTranscripts, type AgoraRtmTranscriptSession } from "@/lib/live-assistance/agora-rtm-transcripts";
import { getBrowserSpeechRecognition, type BrowserSpeechRecognition } from "@/lib/live-assistance/browser-speech";

type Credentials = { appId: string; channel: string; token: string; uid: number; rtmToken: string; rtmUserId: string };
type ContextResult = { mode: "RULE" | "OPENAI"; incidentHelp: string; elapsedMs: number; ai: { relevantFacts: string[]; missingInformation: string } | null };

export default function AgoraPocPage() {
  const rtcRef = useRef<AgoraBrowserSession | null>(null);
  const rtmRef = useRef<AgoraRtmTranscriptSession | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const credentialsRef = useRef<Credentials | null>(null);
  const recentRef = useRef<string[]>([]);
  const agentIdRef = useRef("");
  const [rtc, setRtc] = useState("DISCONNECTED");
  const [agent, setAgent] = useState("STOPPED");
  const [rtm, setRtm] = useState("DISCONNECTED");
  const [agentId, setAgentId] = useState("");
  const [asrSource, setAsrSource] = useState<"AGORA" | "CHROME">("AGORA");
  const asrSourceRef = useRef<"AGORA" | "CHROME">("AGORA");
  const [chromeState, setChromeState] = useState("IDLE");
  const [partial, setPartial] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [transcriptLatency, setTranscriptLatency] = useState<number | null>(null);
  const [context, setContext] = useState<ContextResult | null>(null);
  const [contextState, setContextState] = useState("IDLE");
  const [error, setError] = useState("");

  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setContextState("PROCESSING");
    try {
      const response = await fetch("/api/agora-poc/context", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ statement: text, recentStatements: recentRef.current }) });
      const payload = await response.json() as { success: boolean; data?: ContextResult; error?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "CONTEXT_PROCESSING_FAILED");
      recentRef.current = [...recentRef.current, text].slice(-5);
      setContext(payload.data); setContextState("COMPLETE");
    } catch (cause) { setContextState("FAILED"); setError(`Context 처리 실패: ${cause instanceof Error ? cause.message : "Unknown error"}`); }
  }, []);

  const stopAgent = useCallback(async () => {
    const currentAgentId = agentIdRef.current;
    if (!currentAgentId) return;
    setAgent("STOPPING");
    try { await fetch("/api/agora-poc/agent/stop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agentId: currentAgentId }) }); setAgent("STOPPED"); agentIdRef.current = ""; setAgentId(""); }
    catch { setAgent("ERROR"); }
  }, []);

  const disconnect = useCallback(async () => {
    recognitionRef.current?.abort(); recognitionRef.current = null; setChromeState("IDLE");
    await stopAgent(); await rtmRef.current?.disconnect(); rtmRef.current = null;
    await rtcRef.current?.leave(); rtcRef.current = null; credentialsRef.current = null;
    setRtc("DISCONNECTED"); setRtm("DISCONNECTED");
  }, [stopAgent]);
  useEffect(() => () => { void disconnect(); }, [disconnect]);

  async function connectRtc() {
    setError(""); setRtc("CONNECTING");
    try {
      const response = await fetch("/api/agora-poc/token", { method: "POST" });
      const payload = await response.json() as { success: boolean; data?: Credentials; error?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "AGORA_TOKEN_FAILED");
      credentialsRef.current = payload.data;
      rtcRef.current = await joinAgoraAudioChannel(payload.data, setRtc); setRtc("CONNECTED");
    } catch (cause) { setRtc("FAILED"); setError(`Agora RTC 연결 실패: ${cause instanceof Error ? cause.message : "Unknown error"}`); }
  }

  async function startAgent() {
    const credentials = credentialsRef.current;
    if (!credentials) { setError("먼저 Agora RTC 채널에 연결하세요."); return; }
    setError(""); setAgent("STARTING");
    try {
      // RTM is connected before agent creation so no early transcript is lost.
      rtmRef.current = await connectAgoraRtmTranscripts({ ...credentials, onState: setRtm, onTranscript: (message) => {
        if (asrSourceRef.current !== "AGORA") return;
        if (message.final) { setFinalTranscript(message.text); setPartial(""); setTranscriptLatency(message.latencyMs ?? null); void processTranscript(message.text); }
        else setPartial(message.text);
      } });
      const response = await fetch("/api/agora-poc/agent/start", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel: credentials.channel, userRtcUid: credentials.uid }) });
      const payload = await response.json() as { success: boolean; data?: { agentId: string }; error?: string };
      if (!response.ok || !payload.success || !payload.data) throw new Error(payload.error ?? "CONVOAI_START_FAILED");
      agentIdRef.current = payload.data.agentId; setAgentId(payload.data.agentId); setAgent("STARTED");
    } catch (cause) { await rtmRef.current?.disconnect(); rtmRef.current = null; setAgent("ERROR"); setError(`ConvoAI Agent 시작 실패: ${cause instanceof Error ? cause.message : "Unknown error"}`); }
  }

  function toggleChromeAsr() {
    if (chromeState === "LISTENING") { recognitionRef.current?.stop(); return; }
    const SpeechRecognition = getBrowserSpeechRecognition(); if (!SpeechRecognition) { setError("Chrome Web Speech API를 지원하지 않습니다."); return; }
    const recognition = new SpeechRecognition(); recognition.lang = "ko-KR"; recognition.continuous = true; recognition.interimResults = true;
    recognition.onresult = (event) => { let text = ""; let isFinal = false; for (let i = event.resultIndex; i < event.results.length; i += 1) { const result = event.results[i]; if (result?.[0]) { text += result[0].transcript; isFinal ||= result.isFinal; } } if (isFinal) { setFinalTranscript(text.trim()); void processTranscript(text.trim()); } else setPartial(text.trim()); };
    recognition.onerror = (event) => { setChromeState("IDLE"); setError(`Chrome ASR 오류: ${event.error}`); }; recognition.onend = () => setChromeState("IDLE"); recognition.start(); recognitionRef.current = recognition; setChromeState("LISTENING");
  }

  return <main className="poc-page"><section className="poc-heading"><p className="eyebrow">TECHNICAL PROOF OF CONCEPT · CONVOAI ASR</p><h1>경찰서 현장 대응</h1><p>Agora ARES final transcript만 자동으로 기존 Context API에 전달합니다. Chrome ASR은 비교용 fallback입니다.</p></section><section className="poc-grid">
    <article className="poc-card"><h2>Agora RTC / Agent</h2><p>RTC: <strong>{rtc}</strong></p><p>ConvoAI Agent: <strong>{agent}</strong></p><p>Agent ID: {agentId || "-"}</p><div className="poc-actions"><button onClick={connectRtc} disabled={rtc === "CONNECTED" || rtc === "CONNECTING"}>RTC 연결</button><button onClick={() => void disconnect()} disabled={rtc === "DISCONNECTED"}>종료</button><button onClick={() => void startAgent()} disabled={rtc !== "CONNECTED" || agent === "STARTING" || agent === "STARTED"}>Agent 시작</button><button onClick={() => void stopAgent()} disabled={agent !== "STARTED"}>Agent 중지</button></div></article>
    <article className="poc-card"><h2>ASR 수신</h2><p>ASR Provider: <strong>ARES</strong></p><p>RTM: <strong>{rtm}</strong></p><p>ASR Source: <strong>{asrSource}</strong></p><div className="poc-actions"><button className="secondary" onClick={() => { asrSourceRef.current = "AGORA"; setAsrSource("AGORA"); }}>Agora ASR 사용</button><button className="secondary" onClick={() => { asrSourceRef.current = "CHROME"; setAsrSource("CHROME"); }}>Chrome ASR 사용</button><button onClick={toggleChromeAsr} disabled={asrSource !== "CHROME"}>{chromeState === "LISTENING" ? "Chrome ASR 중지" : "Chrome ASR 시작"}</button></div><p><strong>Agora partial transcript:</strong><br />{asrSource === "AGORA" ? partial || "-" : "Chrome mode"}</p><p><strong>Agora final transcript:</strong><br />{asrSource === "AGORA" ? finalTranscript || "-" : "Chrome mode"}</p><p>Transcript latency: {transcriptLatency === null ? "-" : `${transcriptLatency}ms`}</p></article>
    <article className="poc-card poc-wide"><h2>Context 결과</h2><p>상태: <strong>{contextState}</strong> · 방식: <strong>{context?.mode ?? "NONE"}</strong> · Context latency: {context ? `${context.elapsedMs}ms` : "-"}</p>{context && <div className="result"><p><strong>사건 맥락 도움:</strong> {context.incidentHelp}</p>{context.ai && <><p><strong>관련 사실:</strong> {context.ai.relevantFacts.join(" · ")}</p><p><strong>누락 정보:</strong> {context.ai.missingInformation}</p></>}</div>}</article>
  </section>{error && <p className="poc-error" role="alert">{error}</p>}</main>;
}
