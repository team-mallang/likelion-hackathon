import { Platform } from "react-native";

import {
  CaseGuidesServiceError,
  type CaseGuidesService,
} from "./guides";
import type {
  CaseGuide,
  CaseGuidesOverview,
  GuideCompletionStatus,
} from "@/features/guides/types/guides";
import { resolveGuideAction } from "@/features/guides/utils/guideAction";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function getApiUrl(path: string) {
  if (configuredBaseUrl) {
    return `${configuredBaseUrl}${path}`;
  }

  if (Platform.OS === "web") {
    return path;
  }

  throw new CaseGuidesServiceError("NETWORK_ERROR", "API 주소가 설정되지 않았습니다.");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function getErrorCode(value: unknown): CaseGuidesServiceError["code"] {
  const error = asRecord(value)?.error;
  if (
    error === "AUTHENTICATION_REQUIRED" ||
    error === "INVALID_ACCESS_TOKEN" ||
    error === "FORBIDDEN" ||
    error === "CASE_NOT_FOUND" ||
    error === "GUIDE_NOT_FOUND"
  ) {
    return error;
  }
  return "INTERNAL_SERVER_ERROR";
}

function status(value: unknown): GuideCompletionStatus | null {
  return value === "PENDING" || value === "IN_PROGRESS" || value === "COMPLETED" || value === "SKIPPED"
    ? value
    : null;
}

function urgency(priority: number): CaseGuide["urgency"] {
  if (priority >= 90) return "URGENT";
  if (priority >= 70) return "IMPORTANT";
  return "NORMAL";
}

function parseGuide(value: unknown): CaseGuide | null {
  const guide = asRecord(value);
  if (!guide) return null;

  const guideId = asString(guide.id);
  const title = asString(guide.title);
  const priority = asNumber(guide.priority);
  const completionStatus = status(guide.status);
  if (!guideId || !title || priority === null || !completionStatus) return null;
  const institutionName = asString(guide.institutionName);
  const action = resolveGuideAction({ title, institutionName, priority });

  return {
    guideId,
    priority,
    urgency: urgency(priority),
    title,
    description: asString(guide.description),
    reason: asString(guide.reason),
    preparations: Array.isArray(guide.preparations)
      ? guide.preparations.filter((item): item is string => typeof item === "string")
      : [],
    institutionName,
    contact: asString(guide.contact),
    estimatedMinutes: null,
    actionType: action.actionType,
    actionLabel: action.actionLabel,
    completionStatus,
    completedAt: asString(guide.completedAt),
  };
}

function parseOverview(value: unknown): CaseGuidesOverview | null {
  const response = asRecord(value);
  const data = response?.success === true ? asRecord(response.data) : null;
  const caseId = data && asString(data.id);
  const caseNumber = data && asString(data.caseNumber);
  if (!data || !caseId || !caseNumber || !Array.isArray(data.guideSteps)) return null;

  const parsedGuides = data.guideSteps.map(parseGuide);
  if (!parsedGuides.every((guide): guide is CaseGuide => guide !== null)) {
    return null;
  }
  const guides = parsedGuides;

  const completedCount = guides.filter(
    (guide) => guide.completionStatus === "COMPLETED",
  ).length;

  return {
    caseId,
    caseNumber,
    reportStatusLabel: asString(data.status) ?? "CONFIRMED",
    progressPercent: guides.length === 0 ? 0 : (completedCount / guides.length) * 100,
    heading: "지금 해야 할 일",
    recommendationReason: "확정된 사건 정보에 따라 필요한 행동을 우선순위로 정리했습니다.",
    guides,
  };
}

async function readJson(response: Response) {
  try {
    return await response.json() as unknown;
  } catch {
    throw new CaseGuidesServiceError("INVALID_RESPONSE", "서버 응답을 확인할 수 없습니다.", response.status);
  }
}

export const apiGuidesService: CaseGuidesService = {
  async getOverview({ caseId, accessToken }) {
    let response: Response;
    try {
      response = await fetch(getApiUrl(`/api/cases/${caseId}`), {
        headers: { authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      if (error instanceof CaseGuidesServiceError) throw error;
      throw new CaseGuidesServiceError("NETWORK_ERROR", "행동 가이드를 불러오지 못했습니다.");
    }

    const body = await readJson(response);
    if (!response.ok) {
      const code = getErrorCode(body);
      throw new CaseGuidesServiceError(code, code, response.status);
    }

    const overview = parseOverview(body);
    if (!overview) {
      throw new CaseGuidesServiceError("INVALID_RESPONSE", "가이드 응답 형식이 올바르지 않습니다.", response.status);
    }
    return overview;
  },

  async updateCompletion({ caseId, accessToken, guideId, completionStatus }) {
    let response: Response;
    try {
      response = await fetch(getApiUrl(`/api/cases/${caseId}/guides/${guideId}`), {
        method: "PATCH",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ status: completionStatus }),
      });
    } catch (error) {
      if (error instanceof CaseGuidesServiceError) throw error;
      throw new CaseGuidesServiceError("NETWORK_ERROR", "행동 가이드 상태를 변경하지 못했습니다.");
    }

    const body = await readJson(response);
    if (!response.ok) {
      const code = getErrorCode(body);
      throw new CaseGuidesServiceError(code, code, response.status);
    }
  },
};
