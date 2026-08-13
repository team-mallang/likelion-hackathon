import { NextResponse } from "next/server";
import { isOpenAIConfigured } from "@project/ai";
import { z } from "zod";

import { authorizeCaseRequest } from "@/lib/auth";
import { answerWithIncidentContext } from "@/lib/live-assistance/context-assistant";
import { matchIncidentFact } from "@/lib/live-assistance/context-rules";
import { getLiveAssistanceSession } from "@/lib/live-assistance/session-store";

type RouteContext = { params: Promise<{ id: string; sessionId: string }> };
const schema = z.object({ statement: z.string().trim().min(1).max(1000), recentStatements: z.array(z.string().trim().min(1).max(1000)).max(5).default([]) });

export async function POST(request: Request, context: RouteContext) {
  const { id, sessionId } = await context.params;
  const access = await authorizeCaseRequest(request, id);
  if (!access.ok) return NextResponse.json({ success: false, error: access.error }, { status: access.status });
  const session = getLiveAssistanceSession(sessionId);
  if (!session || session.caseId !== id) return NextResponse.json({ success: false, error: "SESSION_NOT_FOUND" }, { status: 404 });
  let body: unknown; try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "INVALID_JSON" }, { status: 400 }); }
  const parsed = schema.safeParse(body); if (!parsed.success) return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });
  const startedAt = performance.now();
  const rule = matchIncidentFact(parsed.data.statement, session.incident);
  if (rule.matched) return NextResponse.json({ success: true, data: { mode: "RULE", incidentHelp: rule.fact, rule, ai: null, elapsedMs: Math.round(performance.now() - startedAt) } });
  if (!isOpenAIConfigured()) return NextResponse.json({ success: false, error: "OPENAI_NOT_CONFIGURED" }, { status: 503 });
  try {
    const ai = await answerWithIncidentContext({ ...parsed.data, incident: session.incident });
    return NextResponse.json({ success: true, data: { mode: "OPENAI", incidentHelp: ai.tip, rule: null, ai, elapsedMs: Math.round(performance.now() - startedAt) } });
  } catch { return NextResponse.json({ success: false, error: "OPENAI_CONTEXT_FAILED" }, { status: 502 }); }
}
