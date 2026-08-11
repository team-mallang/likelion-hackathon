import { Platform } from "react-native";

import {
  analyzeCaseInputSchema,
  caseAnalysisSuccessResponseSchema,
  createConfirmedCaseSchema,
  createConfirmedCaseSuccessResponseSchema,
  type AnalyzeCaseInput,
  type CaseAnalysisSuccessResponse,
  type CreateConfirmedCaseInput,
  type CreateConfirmedCaseSuccessResponse,
} from "@project/shared";

export type CaseApiErrorCode =
  | "API_NOT_CONFIGURED"
  | "NETWORK_ERROR"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "AI_PROVIDER_NOT_CONFIGURED"
  | "AI_ANALYSIS_FAILED"
  | "AI_INVALID_RESPONSE"
  | "INTERNAL_SERVER_ERROR"
  | "INVALID_RESPONSE";

export class CaseApiError extends Error {
  constructor(
    public readonly code: CaseApiErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "CaseApiError";
  }
}

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

  throw new CaseApiError(
    "API_NOT_CONFIGURED",
    "모바일 API 주소가 설정되지 않았습니다.",
  );
}

function getErrorMessage(code: CaseApiErrorCode) {
  const messages: Record<CaseApiErrorCode, string> = {
    API_NOT_CONFIGURED: "앱의 API 주소를 확인해 주세요.",
    NETWORK_ERROR: "네트워크 연결을 확인하고 다시 시도해 주세요.",
    INVALID_JSON: "서버가 요청 내용을 읽지 못했습니다.",
    INVALID_INPUT: "입력한 사건 내용을 다시 확인해 주세요.",
    AI_PROVIDER_NOT_CONFIGURED: "분석 서비스를 현재 사용할 수 없습니다.",
    AI_ANALYSIS_FAILED: "사건 내용을 분석하지 못했습니다. 다시 시도해 주세요.",
    AI_INVALID_RESPONSE: "분석 결과를 확인할 수 없습니다. 다시 시도해 주세요.",
    INTERNAL_SERVER_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    INVALID_RESPONSE: "서버 응답을 확인할 수 없습니다.",
  };

  return messages[code];
}

async function requestJson(path: string, body: unknown) {
  let response: Response;

  try {
    response = await fetch(getApiUrl(path), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (error instanceof CaseApiError) {
      throw error;
    }

    throw new CaseApiError("NETWORK_ERROR", getErrorMessage("NETWORK_ERROR"));
  }

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new CaseApiError(
      "INVALID_RESPONSE",
      getErrorMessage("INVALID_RESPONSE"),
      response.status,
    );
  }

  if (!response.ok) {
    const serverCode =
      typeof responseBody === "object" &&
      responseBody !== null &&
      "error" in responseBody &&
      typeof responseBody.error === "string"
        ? responseBody.error
        : "INTERNAL_SERVER_ERROR";
    const code = (
      [
        "INVALID_JSON",
        "INVALID_INPUT",
        "AI_PROVIDER_NOT_CONFIGURED",
        "AI_ANALYSIS_FAILED",
        "AI_INVALID_RESPONSE",
        "INTERNAL_SERVER_ERROR",
      ] as const
    ).includes(serverCode as never)
      ? (serverCode as CaseApiErrorCode)
      : "INTERNAL_SERVER_ERROR";

    throw new CaseApiError(code, getErrorMessage(code), response.status);
  }

  return responseBody;
}

export async function analyzeCase(
  input: AnalyzeCaseInput,
): Promise<CaseAnalysisSuccessResponse> {
  const parsedInput = analyzeCaseInputSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new CaseApiError("INVALID_INPUT", getErrorMessage("INVALID_INPUT"));
  }

  const response = await requestJson("/api/cases/analyze", parsedInput.data);
  const parsedResponse = caseAnalysisSuccessResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new CaseApiError(
      "INVALID_RESPONSE",
      getErrorMessage("INVALID_RESPONSE"),
    );
  }

  return parsedResponse.data;
}

export async function createConfirmedCase(
  input: CreateConfirmedCaseInput,
): Promise<CreateConfirmedCaseSuccessResponse> {
  const parsedInput = createConfirmedCaseSchema.safeParse(input);

  if (!parsedInput.success) {
    throw new CaseApiError("INVALID_INPUT", getErrorMessage("INVALID_INPUT"));
  }

  const response = await requestJson("/api/cases", parsedInput.data);
  const parsedResponse =
    createConfirmedCaseSuccessResponseSchema.safeParse(response);

  if (!parsedResponse.success) {
    throw new CaseApiError(
      "INVALID_RESPONSE",
      getErrorMessage("INVALID_RESPONSE"),
    );
  }

  return parsedResponse.data;
}
