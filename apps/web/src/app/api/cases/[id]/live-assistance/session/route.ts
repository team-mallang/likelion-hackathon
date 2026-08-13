import { NextResponse } from "next/server";

import { prisma } from "@project/db";

import { authorizeCaseRequest } from "@/lib/auth";
import { createAgoraSessionCredentials } from "@/lib/live-assistance/agora-token";
import { startConvoAiAgent, stopConvoAiAgent } from "@/lib/live-assistance/convoai-agent";
import { liveAssistanceCaseSelect, toLiveAssistanceIncidentContext } from "@/lib/live-assistance/incident-context";
import { createLiveAssistanceSession } from "@/lib/live-assistance/session-store";

type RouteContext = { params: Promise<{ id: string }> };
export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const access = await authorizeCaseRequest(request, id);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });

  try {
    const foundCase = await prisma.case.findUnique({ where: { id }, select: liveAssistanceCaseSelect });
    if (!foundCase) return NextResponse.json({ success: false, error: "CASE_NOT_FOUND" }, { status: 404 });

    const credentials = createAgoraSessionCredentials();
    const agent = await startConvoAiAgent({ channel: credentials.channel, userRtcUid: credentials.uid });
    const session = createLiveAssistanceSession({ caseId: id, agentId: agent.agentId, credentials, incident: toLiveAssistanceIncidentContext(foundCase) });

    return NextResponse.json({ success: true, data: {
      sessionId: session.id, appId: credentials.appId, channelName: credentials.channel, uid: credentials.uid,
      rtcToken: credentials.token, rtmToken: credentials.rtmToken, rtmUserId: credentials.rtmUserId,
      agentId: agent.agentId, agentRtcUid: agent.agentRtcUid, expiresAt: credentials.expiresAt,
      sourceLanguages: ["ko-KR", "ja-JP"], targetLanguages: ["ko-KR", "ja-JP"],
    } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "LIVE_ASSISTANCE_SESSION_FAILED";
    return NextResponse.json({ success: false, error: code }, { status: code.includes("NOT_CONFIGURED") ? 503 : 502 });
  }
}
