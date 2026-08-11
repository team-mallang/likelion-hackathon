import type {
  InterpreterSessionCredentials,
  PoliceSupportOverview,
} from "@/features/police-support/types/policeSupport";

export type PoliceSupportServiceErrorCode =
  | "INVALID_CASE_ID"
  | "OVERVIEW_NOT_FOUND"
  | "SCRIPT_GENERATION_FAILED"
  | "SESSION_NOT_FOUND"
  | "SESSION_CREATION_FAILED"
  | "SESSION_CLOSE_FAILED"
  | "AUTHENTICATION_REQUIRED"
  | "NETWORK_ERROR"
  | "INVALID_RESPONSE";

export class PoliceSupportServiceError extends Error {
  constructor(
    public readonly code: PoliceSupportServiceErrorCode,
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "PoliceSupportServiceError";
  }
}

export type PoliceSupportCaseInput = {
  caseId: string;
  accessToken?: string;
};

export type CloseInterpreterSessionInput = {
  sessionId: string;
  accessToken?: string;
};

export type PoliceSupportService = {
  getOverview(input: PoliceSupportCaseInput): Promise<PoliceSupportOverview>;
  createInterpreterSession(
    input: PoliceSupportCaseInput,
  ): Promise<InterpreterSessionCredentials>;
  closeInterpreterSession(
    input: CloseInterpreterSessionInput,
  ): Promise<void>;
};
