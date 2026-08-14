export type PiiCategory =
  | "NAME"
  | "PHONE_NUMBER"
  | "EMAIL"
  | "PASSPORT"
  | "RRN"
  | "CARD_NUMBER"
  | "BANK_ACCOUNT";

export type ExpectedEntity = {
  value: string;
  category: PiiCategory;
};

export type PiiFixture = {
  id: string;
  group: "PII" | "NON_PII" | "MIXED" | "STT";
  input: string;
  entities: ExpectedEntity[];
};

export type SanitizerDetection = ExpectedEntity & {
  start: number;
  end: number;
};

export type SanitizerResult = {
  masked: string;
  detections: SanitizerDetection[];
};

export type Sanitizer = {
  name: string;
  version: string;
  sanitize(text: string): Promise<SanitizerResult>;
};
