import { NextResponse } from "next/server";

import { createAgoraSessionCredentials } from "@/lib/live-assistance/agora-token";

export const runtime = "nodejs";

export async function POST() {
  try {
    return NextResponse.json({ success: true, data: createAgoraSessionCredentials() });
  } catch (error) {
    if (error instanceof Error && error.message === "AGORA_NOT_CONFIGURED") {
      return NextResponse.json({ success: false, error: "AGORA_NOT_CONFIGURED" }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: "AGORA_TOKEN_FAILED" }, { status: 500 });
  }
}
