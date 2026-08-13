import { NextResponse } from "next/server";

import { authorizeCaseRequest } from "@/lib/auth";
import { stopConvoAiAgent } from "@/lib/live-assistance/convoai-agent";
import { getLiveAssistanceSession, removeLiveAssistanceSession } from "@/lib/live-assistance/session-store";

type RouteContext = { params: Promise<{ id: string; sessionId: string }> };
export const runtime = "nodejs";

export async function DELETE(request: Request, context: RouteContext) {
  const { id, sessionId } = await context.params;
  const access = await authorizeCaseRequest(request, id);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  const session = getLiveAssistanceSession(sessionId);
  if (!session || session.caseId !== id) return NextResponse.json({ success: false, error: "SESSION_NOT_FOUND" }, { status: 404 });
  try { await stopConvoAiAgent(session.agentId); removeLiveAssistanceSession(sessionId); return NextResponse.json({ success: true }); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "SESSION_CLOSE_FAILED" }, { status: 502 }); }
}
