import { OpenRedaction, type PIIDetection } from "openredaction";

import { koreanPiiPatterns } from "./korean-pii-patterns";

export type PiiType = "NAME" | "PHONE_NUMBER" | "EMAIL" | "PASSPORT" | "RRN" | "CARD_NUMBER" | "BANK_ACCOUNT";
export type SanitizedTextForAI = { text: string; detections: Array<{ type: PiiType }> };
type Detection = { type: PiiType; start: number; end: number };

const aliases: Record<string, PiiType | undefined> = {
  NAME: "NAME", PERSON_NAME: "NAME", EMAIL: "EMAIL", EMAIL_ADDRESS: "EMAIL",
  PHONE: "PHONE_NUMBER", PHONE_NUMBER: "PHONE_NUMBER", PHONE_KR_MOBILE: "PHONE_NUMBER",
  PASSPORT: "PASSPORT", PASSPORT_NUMBER: "PASSPORT", PASSPORT_KR: "PASSPORT",
  RRN: "RRN", KOREAN_RRN: "RRN", CREDIT_CARD: "CARD_NUMBER",
  CREDIT_CARD_NUMBER: "CARD_NUMBER", CARD_NUMBER: "CARD_NUMBER",
  BANK_ACCOUNT: "BANK_ACCOUNT", BANK_ACCOUNT_NUMBER: "BANK_ACCOUNT",
};

function categoryOf(value: string): PiiType | undefined {
  const type = value.toUpperCase();
  if (aliases[type]) return aliases[type];
  if (type.includes("EMAIL")) return "EMAIL";
  return undefined;
}

function overlaps(left: Detection, right: Detection) {
  return left.start < right.end && right.start < left.end;
}

function customDetections(text: string): Array<Detection & { priority: number }> {
  const candidates: Array<Detection & { priority: number }> = [];
  for (const pattern of koreanPiiPatterns) {
    const type = categoryOf(pattern.type);
    if (!type) continue;
    pattern.regex.lastIndex = 0;
    for (const match of text.matchAll(pattern.regex)) {
      if (match.index === undefined || !match[0]) continue;
      candidates.push({ type, start: match.index, end: match.index + match[0].length, priority: pattern.priority });
    }
  }
  const selected: Array<Detection & { priority: number }> = [];
  for (const candidate of candidates.sort((a, b) => b.priority - a.priority || (b.end - b.start) - (a.end - a.start))) {
    if (!selected.some((item) => overlaps(item, candidate))) selected.push(candidate);
  }
  return selected;
}

const redactor = new OpenRedaction({
  redactionMode: "placeholder", deterministic: true, enableFalsePositiveFilter: true,
  enableAuditLog: false, enableMetrics: false, debug: false,
});

export async function sanitizeTextForAI(text: string): Promise<SanitizedTextForAI> {
  const custom = customDetections(text);
  const base = await redactor.detect(text);
  const emailFallbacks: Detection[] = base.detections.flatMap((detection: PIIDetection) => {
    const type = categoryOf(detection.type);
    if (type !== "EMAIL") return [];
    const item = { type, start: detection.position[0], end: detection.position[1] };
    return custom.some((candidate) => overlaps(candidate, item)) ? [] : [item];
  });
  const detections = [...custom, ...emailFallbacks];
  const masked = [...detections].sort((a, b) => b.start - a.start)
    .reduce((result, detection) => `${result.slice(0, detection.start)}[${detection.type}]${result.slice(detection.end)}`, text);
  return {
    text: masked,
    detections: [...detections].sort((a, b) => a.start - b.start).map(({ type }) => ({ type })),
  };
}
