import { Platform } from "react-native";

import type {
  PreviousCaseLookupInput,
  PreviousCaseLookupResult,
} from "@/features/case-access/types/previousCase";

export type PreviousCaseServiceErrorCode =
  | "API_NOT_CONFIGURED"
  | "NETWORK_ERROR"
  | "INVALID_INPUT"
  | "INVALID_CREDENTIALS"
  | "INTERNAL_SERVER_ERROR"
  | "INVALID_RESPONSE";

export class PreviousCaseServiceError extends Error {
  constructor(
    public readonly code: PreviousCaseServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PreviousCaseServiceError";
  }
}

export type PreviousCaseService = {
  lookup(input: PreviousCaseLookupInput): Promise<PreviousCaseLookupResult>;
};

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(
  /\/$/,
  "",
);

function getApiUrl(path: string) {
  if (configuredBaseUrl) {
    return `${configuredBaseUrl}${path}`;
  }

  if (Platform.OS === "web") {
    return path;
  }

  throw new PreviousCaseServiceError(
    "API_NOT_CONFIGURED",
    "앱의 API 주소를 확인해 주세요.",
  );
}

function getErrorMessage(code: PreviousCaseServiceErrorCode) {
  const messages: Record<PreviousCaseServiceErrorCode, string> = {
    API_NOT_CONFIGURED: "앱의 API 주소를 확인해 주세요.",
    NETWORK_ERROR: "네트워크 연결을 확인하고 다시 시도해 주세요.",
    INVALID_INPUT: "사건번호와 비밀번호를 다시 확인해 주세요.",
    INVALID_CREDENTIALS: "사건번호 또는 비밀번호를 확인해 주세요.",
    INTERNAL_SERVER_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    INVALID_RESPONSE: "서버 응답을 확인할 수 없습니다.",
  };

  return messages[code];
}

function getServerErrorCode(value: unknown): PreviousCaseServiceErrorCode {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    value.error === "INVALID_CREDENTIALS"
  ) {
    return "INVALID_CREDENTIALS";
  }

  return "INTERNAL_SERVER_ERROR";
}

function parseLookupResponse(value: unknown): PreviousCaseLookupResult | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("success" in value) ||
    value.success !== true ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null
  ) {
    return null;
  }

  const data = value.data;

  if (
    !("caseId" in data) ||
    typeof data.caseId !== "string" ||
    !("caseNumber" in data) ||
    typeof data.caseNumber !== "string" ||
    !("status" in data) ||
    typeof data.status !== "string" ||
    !("accessToken" in data) ||
    typeof data.accessToken !== "string"
  ) {
    return null;
  }

  return {
    caseId: data.caseId,
    caseNumber: data.caseNumber,
    status: data.status,
    accessToken: data.accessToken,
  };
}

export const previousCaseService: PreviousCaseService = {
  async lookup(input) {
    let response: Response;

    try {
      response = await fetch(getApiUrl("/api/cases/auth"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
    } catch (error) {
      if (error instanceof PreviousCaseServiceError) {
        throw error;
      }

      throw new PreviousCaseServiceError(
        "NETWORK_ERROR",
        getErrorMessage("NETWORK_ERROR"),
      );
    }

    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch {
      throw new PreviousCaseServiceError(
        "INVALID_RESPONSE",
        getErrorMessage("INVALID_RESPONSE"),
        response.status,
      );
    }

    if (!response.ok) {
      const code = getServerErrorCode(responseBody);
      throw new PreviousCaseServiceError(
        code,
        getErrorMessage(code),
        response.status,
      );
    }

    const parsed = parseLookupResponse(responseBody);

    if (!parsed) {
      throw new PreviousCaseServiceError(
        "INVALID_RESPONSE",
        getErrorMessage("INVALID_RESPONSE"),
        response.status,
      );
    }

    return parsed;
  },
};
