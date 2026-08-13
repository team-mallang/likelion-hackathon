import assert from "node:assert/strict";
import { test } from "node:test";

import { createLiveAssistanceSession, getLiveAssistanceSession, removeLiveAssistanceSession } from "./session-store";

test("stores a session only under its own generated id and removes it on cleanup", () => {
  const session = createLiveAssistanceSession({
    caseId: "case-a", agentId: "agent-a",
    credentials: { appId: "app", channel: "channel", uid: 1, token: "rtc", rtmToken: "rtm", rtmUserId: "rtm-user", expiresAt: "2026-08-13T00:00:00.000Z" },
    incident: { type: "STOLEN", countryCode: "JP", lastSeenAt: null, lastSeenPlace: null, discoveredAt: null, discoveredPlace: null, description: null, items: [] },
  });
  assert.equal(getLiveAssistanceSession(session.id)?.caseId, "case-a");
  assert.equal(getLiveAssistanceSession("missing"), null);
  assert.equal(removeLiveAssistanceSession(session.id)?.agentId, "agent-a");
  assert.equal(getLiveAssistanceSession(session.id), null);
});

test("does not return an expired in-memory session", () => {
  const session = createLiveAssistanceSession({
    caseId: "case-expired",
    agentId: "agent-expired",
    credentials: {
      appId: "app", channel: "channel", uid: 1, token: "token", rtmToken: "rtm", rtmUserId: "user",
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
    },
    incident: { type: "STOLEN", countryCode: null, lastSeenAt: null, lastSeenPlace: null, discoveredAt: null, discoveredPlace: null, description: null, items: [] },
  });

  assert.equal(getLiveAssistanceSession(session.id), null);
});
