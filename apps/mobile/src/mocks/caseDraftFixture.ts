import type { CaseDraft } from "@/features/case/types/caseDraft";

export const caseDraftFixture: CaseDraft = {
  statement: "신주쿠역에서 지갑을 잃어버렸어요.",
  inputMode: "voice",

  locationText: "일본 도쿄 신주쿠역 주변",
  coordinates: null,
  occurredAtText: "14:30",

  questions: [
    {
      field: "lastSeenLocation",
      question: "지갑을 마지막으로 확인한 장소는 어디인가요?",
      answer: "신주쿠역 개찰구 앞입니다.",
    },
    {
      field: "walletDescription",
      question: "지갑의 색상이나 특징을 알려주세요.",
      answer: "검은색 가죽 반지갑입니다.",
    },
    {
      field: "emergencyItemIncluded",
      question: "여권이나 긴급하게 필요한 물품도 들어 있었나요?",
      answer: "여권은 없었고 신용카드가 들어 있었습니다.",
    },
  ],

  caseType: "LOST",
  items: [
    {
      id: "wallet-001",
      name: "검은색 가죽 지갑",
      category: "지갑",
      description: "검은색 가죽 반지갑",
    },
    {
      id: "credit-card-001",
      name: "신용카드",
      category: "카드",
      description: "지갑 안에 보관 중이던 신용카드",
    },
  ],

  emergencyItemIncluded: false,
  riskLevel: "MEDIUM",

  details: "신주쿠역을 이동하던 중 지갑을 분실했습니다.",
  clues: "마지막으로 확인한 장소는 신주쿠역 개찰구 앞입니다.",

  isSaving: false,
  errorMessage: null,
};
