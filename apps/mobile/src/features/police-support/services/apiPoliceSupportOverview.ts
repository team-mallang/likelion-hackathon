import { previousCaseCardService } from "@/features/case-card/services/caseCard";
import { PoliceSupportServiceError, type PoliceSupportCaseInput } from "./policeSupport";
import type { PoliceSupportOverview } from "@/features/police-support/types/policeSupport";

export async function getPoliceSupportOverview({ caseId, accessToken }: PoliceSupportCaseInput): Promise<PoliceSupportOverview> {
  if (!accessToken) throw new PoliceSupportServiceError("AUTHENTICATION_REQUIRED", "사건을 다시 인증해 주세요.");
  try {
    const caseCard = await previousCaseCardService.get(caseId, accessToken);
    if (!caseCard.aiSummary) throw new PoliceSupportServiceError("OVERVIEW_NOT_FOUND", "이 사건의 AI 상황 요약이 아직 없습니다.");
    return { caseId, sourceRevision: caseId, presentationScript: { ja: "", ko: caseCard.aiSummary }, suggestions: [], reportDraft: null };
  } catch (error) {
    if (error instanceof PoliceSupportServiceError) throw error;
    throw new PoliceSupportServiceError("NETWORK_ERROR", error instanceof Error ? error.message : "사건 요약을 불러오지 못했습니다.");
  }
}
