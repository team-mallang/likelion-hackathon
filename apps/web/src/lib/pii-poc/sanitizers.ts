import { OpenRedaction, type OpenRedactionOptions, type PIIDetection } from "openredaction";
import { SyncRedactor } from "redact-pii-light";

import { KOREAN_PII_PATTERNS, KOREAN_STT_PATTERNS } from "./korean-patterns.ts";
import type { PiiCategory, Sanitizer, SanitizerDetection, SanitizerResult } from "./types.ts";

const CATEGORY_ALIASES: Record<string, PiiCategory | undefined> = {
  NAME: "NAME", PERSON_NAME: "NAME",
  EMAIL: "EMAIL", EMAIL_ADDRESS: "EMAIL",
  PHONE: "PHONE_NUMBER", PHONE_NUMBER: "PHONE_NUMBER", PHONE_KR_MOBILE: "PHONE_NUMBER",
  PASSPORT: "PASSPORT", PASSPORT_NUMBER: "PASSPORT", PASSPORT_KR: "PASSPORT",
  RRN: "RRN", KOREAN_RRN: "RRN",
  CREDIT_CARD: "CARD_NUMBER", CREDIT_CARD_NUMBER: "CARD_NUMBER", CARD_NUMBER: "CARD_NUMBER",
  BANK_ACCOUNT: "BANK_ACCOUNT", BANK_ACCOUNT_NUMBER: "BANK_ACCOUNT",
};

function categoryOf(type: string): PiiCategory | undefined {
  const upper = type.toUpperCase();
  if (CATEGORY_ALIASES[upper]) return CATEGORY_ALIASES[upper];
  if (upper.includes("EMAIL")) return "EMAIL";
  if (upper.includes("PHONE") || upper.includes("MOBILE")) return "PHONE_NUMBER";
  if (upper.includes("PASSPORT")) return "PASSPORT";
  if (upper.includes("CREDIT_CARD")) return "CARD_NUMBER";
  if (upper.includes("BANK_ACCOUNT")) return "BANK_ACCOUNT";
  if (upper.includes("NAME")) return "NAME";
  return undefined;
}

function canonicalize(text: string, detections: SanitizerDetection[]): string {
  return [...detections]
    .sort((a, b) => b.start - a.start)
    .reduce((result, detection) => `${result.slice(0, detection.start)}[${detection.category}]${result.slice(detection.end)}`, text);
}

function openDetection(detection: PIIDetection): SanitizerDetection | null {
  const category = categoryOf(detection.type);
  if (!category) return null;
  return { value: detection.value, category, start: detection.position[0], end: detection.position[1] };
}

function createOpenRedactionSanitizer(name: string, options: OpenRedactionOptions): Sanitizer {
  const redactor = new OpenRedaction({
    ...options,
    redactionMode: "placeholder",
    deterministic: true,
    enableAuditLog: false,
    enableMetrics: false,
    debug: false,
  });
  return {
    name, version: "1.1.2",
    async sanitize(text) {
      const result = await redactor.detect(text);
      const detections = result.detections.map(openDetection).filter((value): value is SanitizerDetection => value !== null);
      return { masked: canonicalize(text, detections), detections };
    },
  };
}

function overlaps(left: SanitizerDetection, right: SanitizerDetection): boolean {
  return left.start < right.end && right.start < left.end;
}

function detectKoreanPatterns(text: string): SanitizerDetection[] {
  const candidates: Array<SanitizerDetection & { priority: number }> = [];
  for (const pattern of [...KOREAN_PII_PATTERNS, ...KOREAN_STT_PATTERNS]) {
    const category = categoryOf(pattern.type);
    if (!category) continue;
    pattern.regex.lastIndex = 0;
    for (const match of text.matchAll(pattern.regex)) {
      if (match.index === undefined || !match[0]) continue;
      candidates.push({ value: match[0], category, start: match.index, end: match.index + match[0].length, priority: pattern.priority });
    }
  }
  const selected: SanitizerDetection[] = [];
  for (const candidate of candidates.sort((a, b) => b.priority - a.priority || b.value.length - a.value.length)) {
    if (!selected.some((item) => overlaps(item, candidate))) selected.push(candidate);
  }
  return selected;
}

function createHybridSanitizer(): Sanitizer {
  const base = new OpenRedaction({ redactionMode: "placeholder", deterministic: true, enableFalsePositiveFilter: true });
  return {
    name: "OpenRedaction + Korean contextual patterns", version: "1.1.2",
    async sanitize(text) {
      const custom = detectKoreanPatterns(text);
      const result = await base.detect(text);
      // Korean patterns own the evaluated categories. Base detections are kept
      // only when they do not overlap; noisy built-in NAME/PASSPORT/PHONE/BANK
      // matches are intentionally excluded after the baseline exposed them.
      const safeBaseCategories = new Set<PiiCategory>(["EMAIL"]);
      const fallback = result.detections.map(openDetection).filter((value): value is SanitizerDetection =>
        value !== null && safeBaseCategories.has(value.category) && !custom.some((item) => overlaps(item, value))
      );
      const detections = [...custom, ...fallback];
      return { masked: canonicalize(text, detections), detections };
    },
  };
}

function inferLightCategory(value: string): PiiCategory {
  if (value.includes("@")) return "EMAIL";
  if (/^(?:\d[ -]?){15}\d$/.test(value)) return "CARD_NUMBER";
  if (/\d/.test(value)) return "PHONE_NUMBER";
  return "NAME";
}

function parseLightResult(original: string, masked: string): SanitizerResult {
  const tokenPattern = /__PII__/g;
  const matches = [...masked.matchAll(tokenPattern)];
  const detections: SanitizerDetection[] = [];
  let originalCursor = 0;
  let maskedCursor = 0;
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]!;
    const token = match[0];
    const literalBefore = masked.slice(maskedCursor, match.index);
    originalCursor += literalBefore.length;
    const nextStart = (match.index ?? 0) + token.length;
    const nextTokenIndex = index + 1 < matches.length ? matches[index + 1]!.index! : masked.length;
    const literalAfter = masked.slice(nextStart, nextTokenIndex);
    const end = literalAfter ? original.indexOf(literalAfter, originalCursor) : original.length;
    if (end < originalCursor) continue;
    const value = original.slice(originalCursor, end);
    detections.push({ value, category: inferLightCategory(value), start: originalCursor, end });
    originalCursor = end;
    maskedCursor = nextStart;
  }
  return { masked: canonicalize(original, detections), detections };
}

export function createSanitizers(): Sanitizer[] {
  const light = new SyncRedactor({
    globalReplaceWith: "__PII__",
    builtInRedactors: {
      names: { enabled: true }, phoneNumber: { enabled: true }, emailAddress: { enabled: true }, creditCardNumber: { enabled: true },
      streetAddress: { enabled: false }, zipcode: { enabled: false }, ipAddress: { enabled: false },
      usSocialSecurityNumber: { enabled: false }, username: { enabled: false }, password: { enabled: false },
      credentials: { enabled: false }, digits: { enabled: false }, url: { enabled: false },
    },
  });
  return [
    createOpenRedactionSanitizer("OpenRedaction default", { enableFalsePositiveFilter: true }),
    createHybridSanitizer(),
    { name: "redact-pii-light baseline", version: "1.0.0", async sanitize(text) { return parseLightResult(text, light.redact(text)); } },
  ];
}
