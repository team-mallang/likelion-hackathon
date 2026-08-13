import { Platform } from "react-native";

import type { InterpreterSessionCredentials } from "@/features/police-support/types/policeSupport";

export type LiveAssistanceSessionErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "INVALID_ACCESS_TOKEN"
  | "FORBIDDEN"
  | "CASE_NOT_FOUND"
  | "SESSION_NOT_FOUND"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE"
  | "SESSION_CREATION_FAILED"
  | "SESSION_CLOSE_FAILED";

export class LiveAssistanceSessionError extends Error {
  constructor(public readonly code: LiveAssistanceSessionErrorCode, message: string, public readonly status?: number) {
    super(message);
    this.name = "LiveAssistanceSessionError";
  }
}

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function getApiUrl(path: string) {
  if (configuredBaseUrl) return `${configuredBaseUrl}${path}`;
  if (Platform.OS === "web") return path;
  throw new LiveAssistanceSessionError("NETWORK_ERROR", "Mobile API address is not configured.");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : null;
}

function asString(value: unknown): string | null { return typeof value === "string" ? value : null; }
function asNumber(value: unknown): number | null { return typeof value === "number" && Number.isInteger(value) ? value : null; }

function errorCode(body: unknown, fallback: LiveAssistanceSessionErrorCode) {
  const value = asRecord(body)?.error;
  return value === "AUTHENTICATION_REQUIRED" || value === "INVALID_ACCESS_TOKEN" || value === "FORBIDDEN" || value === "CASE_NOT_FOUND" || value === "SESSION_NOT_FOUND" ? value : fallback;
}

function parseCredentials(body: unknown): InterpreterSessionCredentials | null {
  const data = asRecord(body);
  if (!data) return null;
  const sessionId = asString(data.sessionId); const appId = asString(data.appId); const channelName = asString(data.channelName);
  const uid = asNumber(data.uid); const rtcToken = asString(data.rtcToken); const rtmToken = asString(data.rtmToken); const rtmUserId = asString(data.rtmUserId);
  const agentId = asString(data.agentId); const agentRtcUid = asString(data.agentRtcUid); const expiresAt = asString(data.expiresAt);
  if (!sessionId || !appId || !channelName || uid === null || !rtcToken || !rtmToken || !rtmUserId || !agentId || !agentRtcUid || !expiresAt) return null;
  return {
    sessionId, appId, channelName, uid, rtcToken, rtmToken, rtmUserId, agentId, agentRtcUid, expiresAt,
    transcriptionTaskId: agentId,
    sourceLanguages: ["ko-KR", "ja-JP"], targetLanguages: ["ko-KR", "ja-JP"],
  };
}

export type LiveAssistanceSessionService = {
  start(input: { caseId: string; accessToken: string }): Promise<InterpreterSessionCredentials>;
  stop(input: { caseId: string; sessionId: string; accessToken: string }): Promise<void>;
};

export const apiLiveAssistanceSessionService: LiveAssistanceSessionService = {
  async start({ caseId, accessToken }) {
    let response: Response;
    try { response = await fetch(getApiUrl(`/api/cases/${caseId}/live-assistance/session`), { method: "POST", headers: { authorization: `Bearer ${accessToken}` } }); }
    catch { throw new LiveAssistanceSessionError("NETWORK_ERROR", "Unable to create the live assistance session."); }
    let body: unknown; try { body = await response.json(); } catch { throw new LiveAssistanceSessionError("INVALID_RESPONSE", "Invalid session response.", response.status); }
    if (!response.ok) throw new LiveAssistanceSessionError(errorCode(body, "SESSION_CREATION_FAILED"), "Unable to create the live assistance session.", response.status);
    const data = asRecord(body)?.success === true ? parseCredentials(asRecord(body)?.data) : null;
    if (!data) throw new LiveAssistanceSessionError("INVALID_RESPONSE", "Invalid session response.", response.status);
    return data;
  },
  async stop({ caseId, sessionId, accessToken }) {
    let response: Response;
    try { response = await fetch(getApiUrl(`/api/cases/${caseId}/live-assistance/session/${sessionId}`), { method: "DELETE", headers: { authorization: `Bearer ${accessToken}` } }); }
    catch { throw new LiveAssistanceSessionError("NETWORK_ERROR", "Unable to close the live assistance session."); }
    if (response.ok) return;
    let body: unknown; try { body = await response.json(); } catch { body = null; }
    throw new LiveAssistanceSessionError(errorCode(body, "SESSION_CLOSE_FAILED"), "Unable to close the live assistance session.", response.status);
  },
};
