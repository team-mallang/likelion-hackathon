export type PhoneCallServiceErrorCode =
  | "NOT_SUPPORTED"
  | "NUMBER_UNAVAILABLE"
  | "OPEN_FAILED";

export class PhoneCallServiceError extends Error {
  constructor(public readonly code: PhoneCallServiceErrorCode) {
    super("전화 기능을 시작하지 못했습니다.");
    this.name = "PhoneCallServiceError";
  }
}

export type PhoneCallService = {
  call(phoneNumber: string): Promise<void>;
};
