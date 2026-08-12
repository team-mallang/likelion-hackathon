import type {
  CaseGuidesOverview,
  GuideCompletionStatus,
} from "@/features/guides/types/guides";

export type CaseGuidesServiceErrorCode =
  | "AUTHENTICATION_REQUIRED"
  | "INVALID_ACCESS_TOKEN"
  | "FORBIDDEN"
  | "CASE_NOT_FOUND"
  | "GUIDE_NOT_FOUND"
  | "GUIDE_COMPLETION_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE"
  | "INTERNAL_SERVER_ERROR";

export class CaseGuidesServiceError extends Error {
  constructor(
    public readonly code: CaseGuidesServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "CaseGuidesServiceError";
  }
}

export type CaseGuidesService = {
  getOverview(input: {
    caseId: string;
    accessToken: string;
  }): Promise<CaseGuidesOverview>;
  updateCompletion(input: {
    caseId: string;
    accessToken: string;
    guideId: string;
    completionStatus: GuideCompletionStatus;
  }): Promise<void>;
};
