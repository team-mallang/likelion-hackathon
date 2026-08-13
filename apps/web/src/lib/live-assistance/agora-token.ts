import { RtcRole, RtcTokenBuilder, RtmTokenBuilder } from "agora-token";
import { randomInt, randomUUID } from "node:crypto";

const TOKEN_TTL_SECONDS = 30 * 60;

export type AgoraSessionCredentials = {
  appId: string;
  channel: string;
  uid: number;
  token: string;
  rtmToken: string;
  rtmUserId: string;
  expiresAt: string;
};

export function createAgoraSessionCredentials(): AgoraSessionCredentials {
  const appId = process.env.AGORA_APP_ID?.trim();
  const certificate = process.env.AGORA_APP_CERTIFICATE?.trim();
  if (!appId || !certificate) throw new Error("AGORA_NOT_CONFIGURED");

  const channel = `travel-guard-poc-${randomUUID().replaceAll("-", "").slice(0, 20)}`;
  // ConvoAI remote_rtc_uids accepts signed 32-bit positive UIDs only.
  const uid = randomInt(1, 2 ** 31 - 1);
  const rtmUserId = `poc-${uid}`;
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    certificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expiresAtSeconds,
    expiresAtSeconds,
  );
  const rtmToken = RtmTokenBuilder.buildToken(appId, certificate, rtmUserId, expiresAtSeconds);

  return { appId, channel, uid, token, rtmToken, rtmUserId, expiresAt: new Date(expiresAtSeconds * 1000).toISOString() };
}

export function createAgoraAgentRtcToken(channel: string, uid: number) {
  const appId = process.env.AGORA_APP_ID?.trim();
  const certificate = process.env.AGORA_APP_CERTIFICATE?.trim();
  if (!appId || !certificate) throw new Error("AGORA_NOT_CONFIGURED");
  const expiresAtSeconds = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  return RtcTokenBuilder.buildTokenWithRtm2(
    appId,
    certificate,
    channel,
    uid,
    RtcRole.PUBLISHER,
    expiresAtSeconds,
    expiresAtSeconds,
    expiresAtSeconds,
    expiresAtSeconds,
    expiresAtSeconds,
    String(uid),
    expiresAtSeconds,
  );
}
