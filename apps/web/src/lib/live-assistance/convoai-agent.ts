type AgentStartInput = {
  channel: string;
  userRtcUid: number;
};

import { createAgoraAgentRtcToken } from "./agora-token";

type AgentStartResult = { agentId: string; agentRtcUid: string };

const AGENT_RTC_UID = "1000";

function getConfig() {
  const appId = process.env.AGORA_APP_ID?.trim();
  const customerId = process.env.AGORA_CUSTOMER_ID?.trim();
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET?.trim();
  if (!appId || !customerId || !customerSecret) throw new Error("CONVOAI_NOT_CONFIGURED");
  return { appId, customerId, customerSecret };
}

function authorization(customerId: string, customerSecret: string) {
  return `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString("base64")}`;
}

export async function startConvoAiAgent(input: AgentStartInput): Promise<AgentStartResult> {
  const { appId, customerId, customerSecret } = getConfig();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (!openAiKey) throw new Error("OPENAI_NOT_CONFIGURED");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(`https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/join`, {
      method: "POST",
      headers: { Authorization: authorization(customerId, customerSecret), "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
      name: "travel-guard-asr-poc",
      properties: {
        channel: input.channel,
        // The agent must join with a token bound to its own RTC UID, not the
        // browser participant's token.
        token: createAgoraAgentRtcToken(input.channel, Number(AGENT_RTC_UID)),
        agent_rtc_uid: AGENT_RTC_UID,
        remote_rtc_uids: [String(input.userRtcUid)],
        advanced_features: { enable_rtm: true },
        parameters: { data_channel: "rtm" },
        asr: { vendor: "ares", language: "ko-KR" },
        // ConvoAI agents require a full voice-agent pipeline. These minimal
        // settings are only to keep the agent alive while user ASR is tested.
        llm: { url: "https://api.openai.com/v1/chat/completions", api_key: openAiKey, system_messages: [{ role: "system", content: "Reply with one short Korean sentence." }], params: { model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini" } },
        // Microsoft TTS needs a separate Azure key/region. OpenAI TTS uses
        // the already configured server-only key for this minimal Agent.
        tts: { vendor: "openai", params: { api_key: openAiKey, model: "tts-1", voice: "alloy" } },
      },
      }),
    });
    if (!response.ok) {
      const detail = (await response.text()).replaceAll(/\s+/g, " ").slice(0, 240);
      throw new Error(`CONVOAI_START_FAILED_${response.status}${detail ? `: ${detail}` : ""}`);
    }
    const body = await response.json() as { agent_id?: string; data?: { agent_id?: string } };
    const agentId = body.agent_id ?? body.data?.agent_id;
    if (!agentId) throw new Error("CONVOAI_INVALID_START_RESPONSE");
    return { agentId, agentRtcUid: AGENT_RTC_UID };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("CONVOAI_START_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function stopConvoAiAgent(agentId: string) {
  const { appId, customerId, customerSecret } = getConfig();
  const response = await fetch(`https://api.agora.io/api/conversational-ai-agent/v2/projects/${appId}/agents/${encodeURIComponent(agentId)}/leave`, { method: "POST", headers: { Authorization: authorization(customerId, customerSecret) } });
  if (!response.ok) throw new Error(`CONVOAI_STOP_FAILED_${response.status}`);
}
