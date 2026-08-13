import { Platform } from "react-native";

export type LiveAssistanceContextMode = "RULE" | "OPENAI";

export type LiveAssistanceContextResult = {
  mode: LiveAssistanceContextMode;
  incidentHelp: string;
  elapsedMs: number;
  ai: { relevant: boolean; relevantFacts: string[]; tip: string; missingInformation: string } | null;
};

export type LiveAssistanceContextClient = {
  process(input: { caseId: string; sessionId: string; accessToken: string; statement: string; recentStatements: string[] }): Promise<LiveAssistanceContextResult>;
};

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
function url(path: string) {
  if (configuredBaseUrl) return `${configuredBaseUrl}${path}`;
  if (Platform.OS === "web") return path;
  throw new Error("Mobile API address is not configured.");
}

export const apiLiveAssistanceContextClient: LiveAssistanceContextClient = {
  async process({ caseId, sessionId, accessToken, statement, recentStatements }) {
    const response = await fetch(url(`/api/cases/${caseId}/live-assistance/session/${sessionId}/context`), {
      method: "POST",
      headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" },
      body: JSON.stringify({ statement, recentStatements }),
    });
    const body = await response.json() as { success?: boolean; data?: LiveAssistanceContextResult; error?: string };
    if (!response.ok || body.success !== true || !body.data) throw new Error(body.error ?? "LIVE_ASSISTANCE_CONTEXT_FAILED");
    return body.data;
  },
};
