import { createAgoraAgentRtcToken } from "./agora-token";

const STT_SUB_BOT_UID = "1000001";
const STT_PUB_BOT_UID = "1000002";
const STT_GATEWAY = "https://api.sd-rtn.com";

export type AgoraSttTranslation = { agentId: string; pubBotUid: string };
type AgoraSttJoinRequest = {
  name: string;
  languages: string[];
  maxIdleTime: number;
  enableJsonProtocol: boolean;
  rtcConfig: {
    channelName: string;
    subBotUid: string;
    subBotToken: string;
    pubBotUid: string;
    pubBotToken: string;
    subscribeAudioUids: string[];
  };
  translateConfig: { enable: boolean; forceTranslateInterval: number; languages: Array<{ source: string; target: string[] }> };
};

function config() {
  const appId = process.env.AGORA_APP_ID?.trim();
  const customerId = process.env.AGORA_CUSTOMER_ID?.trim();
  const customerSecret = process.env.AGORA_CUSTOMER_SECRET?.trim();
  if (!appId || !customerId || !customerSecret) throw new Error("AGORA_STT_NOT_CONFIGURED");
  return { appId, customerId, customerSecret };
}

function auth(customerId: string, customerSecret: string) {
  return `Basic ${Buffer.from(`${customerId}:${customerSecret}`).toString("base64")}`;
}

async function request(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) throw new Error(`AGORA_STT_REQUEST_FAILED_${response.status}`);
    return response;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new Error("AGORA_STT_REQUEST_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function startAgoraSttTranslation(input: { channel: string; userRtcUid: number }): Promise<AgoraSttTranslation> {
  const { appId, customerId, customerSecret } = config();
  const subBotToken = createAgoraAgentRtcToken(input.channel, Number(STT_SUB_BOT_UID));
  const pubBotToken = createAgoraAgentRtcToken(input.channel, Number(STT_PUB_BOT_UID));
  const joinRequest: AgoraSttJoinRequest = {
    name: `travel-guard-${input.channel}`,
    languages: ["ko-KR", "ja-JP"],
    maxIdleTime: 300,
    enableJsonProtocol: true,
    rtcConfig: {
      channelName: input.channel,
      subBotUid: STT_SUB_BOT_UID,
      subBotToken,
      pubBotUid: STT_PUB_BOT_UID,
      pubBotToken,
      subscribeAudioUids: [String(input.userRtcUid)],
    },
    translateConfig: {
      enable: true,
      forceTranslateInterval: 5,
      languages: [
        { source: "ko-KR", target: ["ja-JP"] },
        { source: "ja-JP", target: ["ko-KR"] },
      ],
    },
  };
  // Deliberately log protocol configuration only. Never log credentials,
  // channel names, tokens, or caption content.
  console.info("[LiveAssistance][AGORA_STT_JOIN_REQUEST]", {
    endpoint: "/api/speech-to-text/v1/projects/:appid/join",
    enableJsonProtocol: joinRequest.enableJsonProtocol,
    languages: joinRequest.languages,
    translationDirections: joinRequest.translateConfig.languages.map(({ source, target }) => ({ source, target })),
    rtcConfig: { subBotUid: joinRequest.rtcConfig.subBotUid, pubBotUid: joinRequest.rtcConfig.pubBotUid, subscribeAudioUidCount: joinRequest.rtcConfig.subscribeAudioUids.length, hasTokens: true },
  });
  const response = await request(`${STT_GATEWAY}/api/speech-to-text/v1/projects/${appId}/join`, {
    method: "POST",
    headers: { Authorization: auth(customerId, customerSecret), "Content-Type": "application/json" },
    body: JSON.stringify(joinRequest),
  });
  const body = await response.json() as { agent_id?: string; status?: string };
  console.info("[LiveAssistance][AGORA_STT_JOIN_RESPONSE]", { hasAgentId: Boolean(body.agent_id), status: body.status ?? null });
  if (!body.agent_id || (body.status && body.status !== "RUNNING" && body.status !== "STARTING")) {
    throw new Error("AGORA_STT_INVALID_START_RESPONSE");
  }
  return { agentId: body.agent_id, pubBotUid: STT_PUB_BOT_UID };
}

export async function queryAgoraSttTranslation(agentId: string) {
  const { appId, customerId, customerSecret } = config();
  const response = await request(`${STT_GATEWAY}/api/speech-to-text/v1/projects/${appId}/agents/${encodeURIComponent(agentId)}`, {
    headers: { Authorization: auth(customerId, customerSecret) },
  });
  const body = await response.json() as { agent_id?: string; status?: string };
  console.info("[LiveAssistance][AGORA_STT_STATUS_RESPONSE]", { hasAgentId: Boolean(body.agent_id), status: body.status ?? null });
  return body;
}

export async function stopAgoraSttTranslation(agentId: string) {
  const { appId, customerId, customerSecret } = config();
  await request(`${STT_GATEWAY}/api/speech-to-text/v1/projects/${appId}/agents/${encodeURIComponent(agentId)}/leave`, {
    method: "POST", headers: { Authorization: auth(customerId, customerSecret) },
  });
}
