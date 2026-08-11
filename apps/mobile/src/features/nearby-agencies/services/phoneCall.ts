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

export const externalPhoneCallService: PhoneCallService = {
  async call(phoneNumber) {
    const normalizedNumber = phoneNumber.trim();

    if (!normalizedNumber) {
      throw new PhoneCallServiceError("NUMBER_UNAVAILABLE");
    }

    const url = `tel:${encodeURIComponent(normalizedNumber)}`;

    if (!(await Linking.canOpenURL(url))) {
      throw new PhoneCallServiceError("NOT_SUPPORTED");
    }

    try {
      await Linking.openURL(url);
    } catch {
      throw new PhoneCallServiceError("OPEN_FAILED");
    }
  },
};
import { Linking } from "react-native";
