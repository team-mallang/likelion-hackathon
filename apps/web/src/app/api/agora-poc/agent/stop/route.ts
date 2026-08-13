import { NextResponse } from "next/server";
import { z } from "zod";
import { stopConvoAiAgent } from "@/lib/live-assistance/convoai-agent";

export const runtime = "nodejs";
const schema = z.object({ agentId: z.string().min(1).max(200) });
export async function POST(request: Request) {
  try { const parsed = schema.safeParse(await request.json()); if (!parsed.success) return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 }); await stopConvoAiAgent(parsed.data.agentId); return NextResponse.json({ success: true }); }
  catch (error) { return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "CONVOAI_STOP_FAILED" }, { status: 502 }); }
}
