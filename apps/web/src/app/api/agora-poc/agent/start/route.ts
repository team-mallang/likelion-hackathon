import { NextResponse } from "next/server";
import { z } from "zod";
import { startConvoAiAgent } from "@/lib/live-assistance/convoai-agent";

export const runtime = "nodejs";
const schema = z.object({ channel: z.string().min(1).max(64), userRtcUid: z.number().int().positive() });
export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ success: false, error: "INVALID_INPUT" }, { status: 400 });
    return NextResponse.json({ success: true, data: await startConvoAiAgent(parsed.data) });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CONVOAI_START_FAILED";
    return NextResponse.json({ success: false, error: code }, { status: code === "CONVOAI_NOT_CONFIGURED" ? 503 : 502 });
  }
}
