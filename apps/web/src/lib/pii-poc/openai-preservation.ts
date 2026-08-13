import { loadEnvConfig } from "@next/env";
import { analyzeCaseWithOpenAI, isOpenAIConfigured } from "@project/ai";

import { createSanitizers } from "./sanitizers.ts";

loadEnvConfig(process.cwd());

if (!isOpenAIConfigured()) {
  throw new Error("OPENAI_NOT_CONFIGURED: set OPENAI_API_KEY in apps/web/.env.local");
}

const sanitizer = createSanitizers().find((candidate) => candidate.name.includes("contextual"));
if (!sanitizer) throw new Error("Korean contextual sanitizer is unavailable");
const contextualSanitizer = sanitizer;

const cases = [
  "저는 박지민이고 신주쿠역에서 오후 8시 10분에 검정 지갑을 잃어버렸습니다. 전화번호는 010-1234-5678입니다.",
  "제 이름은 김민수이고 파란 아이폰 15를 도난당했습니다. 마지막으로 확인한 곳은 시부야역이고 시간은 오후 7시 30분입니다. 이메일은 minsu@example.com입니다.",
  "신고자 이름은 이서준입니다. 빨간 샘소나이트 가방을 잃어버렸고 마지막 확인 장소는 도쿄역, 시간은 8월 12일 오후 6시입니다. 손잡이에 별 스티커가 있습니다. 연락처는 010-8765-4321입니다.",
  "제 이름은 윤지호입니다.",
  "전화번호는 010-2468-1357이고 카드는 두 장 있었습니다.",
];

function comparable(result: Awaited<ReturnType<typeof analyzeCaseWithOpenAI>>) {
  const normalizeDate = (value: string | null) => value ? new Date(value).getTime() : null;
  const normalizeColor = (value: string | null) => value?.replace(/색$/, "") ?? null;
  const normalizePlace = (value: string | null) => {
    if (!value) return null;
    const compact = value.toLowerCase().replace(/\s+/g, "");
    if (compact === "신주쿠역" || compact === "shinjukustation") return "SHINJUKU_STATION";
    if (compact === "시부야역" || compact === "shibuyastation") return "SHIBUYA_STATION";
    if (compact === "도쿄역" || compact === "tokyostation") return "TOKYO_STATION";
    return compact;
  };
  return {
    type: result.details.type,
    lastSeenAt: normalizeDate(result.details.lastSeenAt),
    lastSeenPlace: normalizePlace(result.details.lastSeenPlace),
    discoveredAt: normalizeDate(result.details.discoveredAt),
    discoveredPlace: normalizePlace(result.details.discoveredPlace),
    items: result.items.map((item) => ({
      category: item.category,
      color: normalizeColor(item.color),
      brand: item.brand,
      model: item.model,
      quantity: item.quantity,
      identifyingFeature: item.identifyingFeature,
    })),
  };
}

async function main() {
 let preserved = 0;
 for (let index = 0; index < cases.length; index += 1) {
  const originalStatement = cases[index]!;
  const { masked } = await contextualSanitizer.sanitize(originalStatement);
  const baseInput = {
    countryCode: "JP",
    type: "UNKNOWN" as const,
    referenceTime: "2026-08-13T22:00:00+09:00",
    timeZone: "Asia/Tokyo",
    items: [],
    answers: [],
  };
  const original = comparable(await analyzeCaseWithOpenAI({ ...baseInput, initialStatement: originalStatement }));
  const sanitized = comparable(await analyzeCaseWithOpenAI({ ...baseInput, initialStatement: masked }));
  const matches = JSON.stringify(original) === JSON.stringify(sanitized);
  if (matches) preserved += 1;
  console.log(`Case ${index + 1}: ${matches ? "PRESERVED" : "CHANGED"}`);
  if (!matches) {
    console.log("Original analysis:", JSON.stringify(original));
    console.log("Masked analysis:", JSON.stringify(sanitized));
  }
 }

 console.log(`OpenAI incident analysis preservation: ${preserved} / ${cases.length}`);
 if (preserved !== cases.length) process.exitCode = 1;
}

void main();
