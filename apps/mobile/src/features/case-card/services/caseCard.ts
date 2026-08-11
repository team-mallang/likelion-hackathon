import { Platform } from "react-native";

import type { PreviousCaseCard } from "@/features/case-card/types/caseCard";

export type PreviousCaseCardServiceErrorCode =
  | "API_NOT_CONFIGURED"
  | "NETWORK_ERROR"
  | "AUTHENTICATION_REQUIRED"
  | "INVALID_ACCESS_TOKEN"
  | "FORBIDDEN"
  | "CASE_NOT_FOUND"
  | "INTERNAL_SERVER_ERROR"
  | "INVALID_RESPONSE";

export class PreviousCaseCardServiceError extends Error {
  constructor(
    public readonly code: PreviousCaseCardServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PreviousCaseCardServiceError";
  }
}

export type PreviousCaseCardService = {
  get(caseId: string, accessToken: string): Promise<PreviousCaseCard>;
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

  throw new PreviousCaseCardServiceError(
    "API_NOT_CONFIGURED",
    "앱의 API 주소를 확인해 주세요.",
  );
}

function getErrorMessage(code: PreviousCaseCardServiceErrorCode) {
  const messages: Record<PreviousCaseCardServiceErrorCode, string> = {
    API_NOT_CONFIGURED: "앱의 API 주소를 확인해 주세요.",
    NETWORK_ERROR: "네트워크 연결을 확인하고 다시 시도해 주세요.",
    AUTHENTICATION_REQUIRED: "이전 사건을 다시 조회해 주세요.",
    INVALID_ACCESS_TOKEN: "접근 시간이 만료되었습니다. 이전 사건을 다시 조회해 주세요.",
    FORBIDDEN: "이 사건을 조회할 권한이 없습니다.",
    CASE_NOT_FOUND: "이전 사건을 찾을 수 없습니다.",
    INTERNAL_SERVER_ERROR: "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
    INVALID_RESPONSE: "서버 응답을 확인할 수 없습니다.",
  };

  return messages[code];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getServerErrorCode(value: unknown): PreviousCaseCardServiceErrorCode {
  const error = asRecord(value)?.error;

  if (
    error === "AUTHENTICATION_REQUIRED" ||
    error === "INVALID_ACCESS_TOKEN" ||
    error === "FORBIDDEN" ||
    error === "CASE_NOT_FOUND"
  ) {
    return error;
  }

  return "INTERNAL_SERVER_ERROR";
}

function mapCaseType(value: string | null) {
  if (value === "LOST") {
    return "분실";
  }

  if (value === "STOLEN") {
    return "도난";
  }

  return "확인 중";
}

function mapStatus(value: string | null) {
  if (value === "CONFIRMED") {
    return "신고 완료";
  }

  if (value === "IN_PROGRESS") {
    return "처리 중";
  }

  if (value === "COMPLETED") {
    return "처리 완료";
  }

  return "확인 중";
}

function itemDescription(item: Record<string, unknown>) {
  const values = [
    asString(item.category),
    typeof item.quantity === "number" ? `Quantity: ${item.quantity}` : null,
    asString(item.brand),
    asString(item.model),
    asString(item.color),
    asString(item.description),
    asString(item.identifyingFeature),
    asString(item.phoneCaseDescription),
    asString(item.shape),
    asString(item.contentsDescription),
    asString(item.passportDocumentType),
    asString(item.departureAt),
    asString(item.lastSeenAt),
    asString(item.lastSeenPlace),
    asString(item.currency),
    typeof item.cashAmount === "number" ? String(item.cashAmount) : null,
    typeof item.unauthorizedTransactionOccurred === "boolean" ? `Unauthorized transaction: ${item.unauthorizedTransactionOccurred ? "yes" : "no"}` : null,
    typeof item.findMyDeviceAvailable === "boolean" ? `Find My device: ${item.findMyDeviceAvailable ? "available" : "unavailable"}` : null,
    typeof item.passportNumberKnown === "boolean" ? `Passport number known: ${item.passportNumberKnown ? "yes" : "no"}` : null,
  ].filter((value): value is string => Boolean(value));

  return values.length > 0 ? values.join(" · ") : null;
}

function parsePreviousCaseCard(value: unknown): PreviousCaseCard | null {
  const response = asRecord(value);
  const data = response && response.success === true ? asRecord(response.data) : null;

  if (!data) {
    return null;
  }

  const caseId = asString(data.id);
  const caseNumber = asString(data.caseNumber);

  if (!caseId || !caseNumber) {
    return null;
  }

  const type = asString(data.type);
  const incidentTypeLabel = mapCaseType(type);
  const occurredAt = asString(data.lastSeenAt) ?? asString(data.discoveredAt);
  const locationLabel =
    asString(data.lastSeenPlace) ?? asString(data.discoveredPlace);
  const items = Array.isArray(data.items)
    ? data.items.flatMap((item) => {
        const record = asRecord(item);
        const id = record ? asString(record.id) : null;
        const title = record ? asString(record.name) : null;

        return record && id && title
          ? [{ id, title, description: itemDescription(record) }]
          : [];
      })
    : [];
  const incidentDetailCandidates: Array<[string, string | null]> = [
    ["인지 시간", asString(data.discoveredAt)],
    ["인지 장소", asString(data.discoveredPlace)],
    ["마지막 확인 시간", asString(data.lastSeenAt)],
    ["마지막 확인 장소", asString(data.lastSeenPlace)],
    ["발생 추정 시간", asString(data.estimatedOccurredAt)],
    ["발생 추정 장소", asString(data.estimatedOccurredPlace)],
    ["마지막 확인 이후 이동경로", asString(data.routeAfterLastSeen)],
    ["보관 상태", asString(data.storageState)],
  ];
  const incidentDetails = incidentDetailCandidates.flatMap(([label, detail]) =>
    detail ? [{ label, value: detail }] : [],
  );

  return {
    caseId,
    caseNumber,
    reportStatusLabel: mapStatus(asString(data.status)),
    title: `${incidentTypeLabel} 사건`,
    incidentTypeLabel,
    occurredAt,
    locationLabel,
    aiSummary: asString(data.aiSummary),
    aiSummaryStatus: asString(data.aiSummary) ? "READY" : "UNAVAILABLE",
    lostItems: items,
    clues: asString(data.description),
    notes: asString(data.initialStatement),
    incidentDetails,
  };
}

export const previousCaseCardService: PreviousCaseCardService = {
  async get(caseId, accessToken) {
    let response: Response;

    try {
      response = await fetch(getApiUrl(`/api/cases/${caseId}`), {
        headers: { authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      if (error instanceof PreviousCaseCardServiceError) {
        throw error;
      }

      throw new PreviousCaseCardServiceError(
        "NETWORK_ERROR",
        getErrorMessage("NETWORK_ERROR"),
      );
    }

    let responseBody: unknown;

    try {
      responseBody = await response.json();
    } catch {
      throw new PreviousCaseCardServiceError(
        "INVALID_RESPONSE",
        getErrorMessage("INVALID_RESPONSE"),
        response.status,
      );
    }

    if (!response.ok) {
      const code = getServerErrorCode(responseBody);
      throw new PreviousCaseCardServiceError(
        code,
        getErrorMessage(code),
        response.status,
      );
    }

    const parsed = parsePreviousCaseCard(responseBody);

    if (!parsed) {
      throw new PreviousCaseCardServiceError(
        "INVALID_RESPONSE",
        getErrorMessage("INVALID_RESPONSE"),
        response.status,
      );
    }

    return parsed;
  },
};
