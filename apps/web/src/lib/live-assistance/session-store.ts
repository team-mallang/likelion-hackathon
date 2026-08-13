import { randomUUID } from "node:crypto";

import type { AgoraSessionCredentials } from "./agora-token";
import type { LiveAssistanceIncidentContext } from "./incident-context";

export type LiveAssistanceSession = {
  id: string;
  caseId: string;
  agentId: string;
  credentials: AgoraSessionCredentials;
  incident: LiveAssistanceIncidentContext;
  createdAt: string;
};

const sessions = new Map<string, LiveAssistanceSession>();

function isExpired(session: LiveAssistanceSession) {
  const expiresAt = new Date(session.credentials.expiresAt).getTime();
  return Number.isNaN(expiresAt) || expiresAt <= Date.now();
}

function removeExpiredSessions() {
  for (const [id, session] of sessions) {
    if (isExpired(session)) sessions.delete(id);
  }
}

export function createLiveAssistanceSession(input: Omit<LiveAssistanceSession, "id" | "createdAt">) {
  removeExpiredSessions();
  const session: LiveAssistanceSession = {
    ...input,
    id: `live-${randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  sessions.set(session.id, session);
  return session;
}

export function getLiveAssistanceSession(sessionId: string) {
  const session = sessions.get(sessionId) ?? null;
  if (session && isExpired(session)) {
    sessions.delete(sessionId);
    return null;
  }
  return session;
}

export function removeLiveAssistanceSession(sessionId: string) {
  const session = sessions.get(sessionId) ?? null;
  sessions.delete(sessionId);
  return session;
}
