import type { CaseDraft } from "@/features/case/types/caseDraft";

export const caseDraftFixture: CaseDraft = {
  initialStatement: "신주쿠역에서 지갑을 잃어버렸어요.",
  countryCode: "JP",
  type: "LOST",
  lastSeenAt: null,
  lastSeenPlace: "일본 도쿄 신주쿠역 근처",
  discoveredAt: null,
  discoveredPlace: null,
  description: "신주쿠역을 이동하던 중 지갑을 분실했습니다.",
  aiSummary: null,
  missingFields: [],
  questions: [],
  answers: [],
  items: [
    {
      name: "검정색 가죽 지갑",
      category: "지갑",
      quantity: 1,
      description: "검정색 가죽 반지갑",
    },
    {
      name: "신용카드",
      category: "카드",
      quantity: 1,
      description: "지갑 안에 보관 중이던 신용카드",
    },
  ],
  inputMode: "voice",
  coordinates: null,
  emergencyItemIncluded: true,
  riskLevel: "MEDIUM",
  errorMessage: null,
};
