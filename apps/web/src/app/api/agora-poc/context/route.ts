import { NextResponse } from "next/server";
import { isOpenAIConfigured } from "@project/ai";
import { z } from "zod";

import { answerWithIncidentContext } from "@/lib/live-assistance/context-assistant";
import { matchIncidentFact } from "@/lib/live-assistance/context-rules";
import { mockIncident } from "@/lib/live-assistance/mock-incident";

const requestSchema = z.object({
  statement: z.string().trim().min(1).max(1000),
  recentStatements: z.array(z.string().trim().min(1).max(1000)).max(5).default([]),
});

export async function POST(request: Request) {
  const startedAt = performance.now();
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: "INVALID_JSON" }, { status: 400 }); }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });

  const rule = matchIncidentFact(parsed.data.statement, mockIncident);
  if (rule.matched) {
    return NextResponse.json({ success: true, data: { mode: "RULE", incidentHelp: rule.fact, rule, ai: null, elapsedMs: Math.round(performance.now() - startedAt) } });
  }

  if (!isOpenAIConfigured()) {
    return NextResponse.json({ success: false, error: "OPENAI_NOT_CONFIGURED" }, { status: 503 });
  }

  try {
    const ai = await answerWithIncidentContext({ ...parsed.data, incident: mockIncident });
    return NextResponse.json({ success: true, data: { mode: "OPENAI", incidentHelp: ai.tip, rule: null, ai, elapsedMs: Math.round(performance.now() - startedAt) } });
  } catch (error) {
    console.error("POST /api/agora-poc/context failed", { errorType: error instanceof Error ? error.name : "UnknownError" });
    return NextResponse.json({ success: false, error: "OPENAI_CONTEXT_FAILED" }, { status: 502 });
  }
}
