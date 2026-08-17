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
  } catch (error) {
    const providerError = error as {
      status?: unknown;
      code?: unknown;
    };
    const details = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          status: typeof providerError.status === "number"
            ? providerError.status
            : null,
          code: typeof providerError.code === "string"
            ? providerError.code
            : null,
        }
      : { name: "UnknownError", message: null, status: null, code: null };
    // Do not log the statement or incident context. This records only the
    // provider/validation failure that is otherwise collapsed into HTTP 502.
    const rateLimited = details.status === 429 || details.code === "rate_limit_exceeded";
    console.error("[LiveAssistance][CONTEXT_PROCESSING_FAILED]", details);
    if (rateLimited) {
      return NextResponse.json(
        { success: false, error: "OPENAI_RATE_LIMITED" },
        { status: 429 },
      );
    }
    return NextResponse.json({ success: false, error: "OPENAI_CONTEXT_FAILED" }, { status: 502 });
  }
}
