import { Platform } from "react-native";

export type LiveAssistanceContextMode = "RULE" | "OPENAI";

export type LiveAssistanceContextResult = {
  mode: LiveAssistanceContextMode;
  incidentHelp: string;
  elapsedMs: number;
  ai: { relevant: boolean; relevantFacts: string[]; tip: string; missingInformation: string } | null;
};

export type LiveAssistanceContextErrorCode =
  | "OPENAI_RATE_LIMITED"
  | "OPENAI_CONTEXT_FAILED";

export class LiveAssistanceContextError extends Error {
  constructor(
    public readonly code: LiveAssistanceContextErrorCode,
    public readonly status?: number,
  ) {
    super(code);
    this.name = "LiveAssistanceContextError";
  }
}

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
    if (!response.ok || body.success !== true || !body.data) {
      throw new LiveAssistanceContextError(
        body.error === "OPENAI_RATE_LIMITED"
          ? "OPENAI_RATE_LIMITED"
          : "OPENAI_CONTEXT_FAILED",
        response.status,
      );
    }
    return body.data;
  },
};
