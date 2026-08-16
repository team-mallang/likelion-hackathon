import type { PoliceReportDraft as ApiPoliceReportDraft } from "@project/shared";

import {
  PoliceReportServiceError,
  type PoliceReportService,
} from "@/features/police-report/services/policeReport";
import type {
  LocalizedText,
  PoliceReportDraft,
  PoliceReportField,
  PoliceReportItem,
} from "@/features/police-report/types/policeReport";

const configuredBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
const draftCache = new Map<string, PoliceReportDraft>();
const draftVersions = new Map<string, number>();

function getApiUrl(path: string) {
  if (configuredBaseUrl) return `${configuredBaseUrl}${path}`;
  if (typeof document !== "undefined") return path;
  throw new PoliceReportServiceError("NETWORK_ERROR", "API 주소를 확인해 주세요.");
}

function localized(valueKo: string | null, valueJa: string | null): LocalizedText {
  return { ko: valueKo ?? "", ja: valueJa ?? "" };
}

function toField(field: ApiPoliceReportDraft["sections"][number]["fields"][number]): PoliceReportField {
  const missing = field.valueKo === null && field.valueJa === null;
  return {
    id: field.key,
    label: { ko: field.labelKo, ja: field.labelJa },
    value: localized(field.valueKo, field.valueJa),
    required: field.source === "USER_REQUIRED",
    missing,
  };
}

function toItems(fields: ApiPoliceReportDraft["sections"][number]["fields"]): PoliceReportItem[] {
  const groups = new Map<number, typeof fields>();
  for (const field of fields) {
    const match = /^item_(\d+)_(.+)$/.exec(field.key);
    if (!match) continue;
    const order = Number(match[1]);
    groups.set(order, [...(groups.get(order) ?? []), field]);
  }

  return [...groups.entries()].map(([order, itemFields]) => {
    const name = itemFields.find((field) => field.key === `item_${order}_name`);
    return {
      id: `item_${order}`,
      order,
      title: name ? localized(name.valueKo, name.valueJa) : { ko: `물품 ${order}`, ja: `物品 ${order}` },
      details: itemFields
        .filter((field) => field !== name && (field.valueKo !== null || field.valueJa !== null))
        .map((field) => ({
          id: field.key,
          text: localized(
            field.valueKo ? `${field.labelKo}: ${field.valueKo}` : null,
            field.valueJa ? `${field.labelJa}: ${field.valueJa}` : null,
          ),
        })),
    };
  });
}

function toMobileDraft(caseId: string, apiDraft: ApiPoliceReportDraft, version: number): PoliceReportDraft {
  const section = (key: ApiPoliceReportDraft["sections"][number]["key"]) =>
    apiDraft.sections.find((item) => item.key === key)?.fields ?? [];
  const statement = section("statement")[0];
  const reporter = section("reporter").map(toField);
  const incident = section("incident").map(toField);

  return {
    draftId: `report-draft-${caseId}`,
    caseId,
    version,
    sourceRevision: "case-api",
    status: "READY",
    source: "CASE_CARD",
    caseType: apiDraft.caseType,
    applicantFields: reporter,
    incidentFields: incident,
    items: toItems(section("items")),
    narrative: localized(statement?.valueKo ?? null, statement?.valueJa ?? null),
    missingFieldIds: [...reporter, ...incident].filter((field) => field.missing).map((field) => field.id),
  };
}

async function requestDraft(
  caseId: string,
  accessToken?: string,
  edits?: Array<{ key: string; valueKo: string | null }>,
) {
  let response: Response;
  try {
    response = await fetch(getApiUrl(`/api/cases/${caseId}/report-draft`), {
      method: edits ? "PATCH" : "POST",
      headers: {
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
        ...(edits ? { "content-type": "application/json" } : {}),
      },
      body: edits ? JSON.stringify({ edits }) : undefined,
    });
  } catch {
    throw new PoliceReportServiceError("NETWORK_ERROR", "신고서 초안을 불러오지 못했습니다.");
  }

  const body = await response.json().catch(() => null) as { success?: boolean; data?: ApiPoliceReportDraft; error?: string } | null;
  if (!response.ok || !body?.success || !body.data) {
    throw new PoliceReportServiceError(
      body?.error === "REQUIRED_INFORMATION_MISSING" ? "REQUIRED_INFORMATION_MISSING" : "GENERATION_FAILED",
      "신고서 초안을 불러오지 못했습니다.",
      response.status,
    );
  }
  return body.data;
}

export function createApiPoliceReportService(): PoliceReportService {
  return {
    async getOrCreateDraft({ caseId, accessToken }) {
      const cachedDraft = draftCache.get(caseId);
      if (cachedDraft) {
        return cachedDraft;
      }

      const version = draftVersions.get(caseId) ?? 1;
      const draft = toMobileDraft(caseId, await requestDraft(caseId, accessToken), version);
      draftVersions.set(caseId, version);
      draftCache.set(caseId, draft);
      return draft;
    },
    async regenerateDraft({ caseId, accessToken }) {
      const version = (draftVersions.get(caseId) ?? 0) + 1;
      const draft = toMobileDraft(caseId, await requestDraft(caseId, accessToken), version);
      draftVersions.set(caseId, version);
      draftCache.set(caseId, draft);
      return draft;
    },
    async updateDraft({ caseId, accessToken, edits }) {
      const version = (draftVersions.get(caseId) ?? 0) + 1;
      const draft = toMobileDraft(
        caseId,
        await requestDraft(caseId, accessToken, edits),
        version,
      );
      draftVersions.set(caseId, version);
      draftCache.set(caseId, draft);
      return draft;
    },
    async createExport() {
      throw new PoliceReportServiceError("EXPORT_NOT_CONFIGURED", "신고서 내보내기는 아직 준비되지 않았습니다.");
    },
  };
}
