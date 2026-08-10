import {
  guideGenerationInputSchema,
  guideStepDraftListSchema,
  type GuideGenerationInput,
  type GuideStepDraft,
} from "@project/shared";

type GuideRule = Omit<GuideStepDraft, "stepOrder"> & {
  id: string;
};

const CARD_KEYWORDS = [
  "card",
  "creditcard",
  "debitcard",
  "신용카드",
  "체크카드",
  "현금카드",
];

const PHONE_KEYWORDS = [
  "phone",
  "smartphone",
  "cellphone",
  "iphone",
  "galaxy",
  "휴대폰",
  "핸드폰",
  "스마트폰",
  "아이폰",
  "갤럭시",
];

const PASSPORT_KEYWORDS = ["passport", "여권"];

function normalizeForMatching(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function itemSearchText(item: GuideGenerationInput["items"][number]) {
  return [
    item.name,
    item.category,
    item.brand,
    item.model,
    item.description,
    item.identifyingFeature,
  ]
    .map(normalizeForMatching)
    .join(" ");
}

function includesKeyword(
  input: GuideGenerationInput,
  keywords: string[],
) {
  return input.items.some((item) => {
    const searchable = itemSearchText(item);
    return keywords.some((keyword) =>
      searchable.includes(normalizeForMatching(keyword)),
    );
  });
}

function addRule(rules: Map<string, GuideRule>, rule: GuideRule) {
  if (!rules.has(rule.id)) {
    rules.set(rule.id, rule);
  }
}

export function createGuideSteps(
  rawInput: GuideGenerationInput,
): GuideStepDraft[] {
  const input = guideGenerationInputSchema.parse(rawInput);
  const rules = new Map<string, GuideRule>();
  const hasCard = includesKeyword(input, CARD_KEYWORDS);
  const hasPhone = includesKeyword(input, PHONE_KEYWORDS);
  const hasPassport = includesKeyword(input, PASSPORT_KEYWORDS);

  if (hasCard) {
    addRule(rules, {
      id: "block-payment-cards",
      title: "결제카드 즉시 정지",
      description:
        "카드사 앱이나 고객센터를 통해 분실·도난 카드를 즉시 정지하세요.",
      reason: "무단 결제와 추가 금전 피해를 막기 위한 최우선 조치입니다.",
      preparations: ["카드사명", "카드사 앱 또는 고객센터 연락 수단"],
      institutionName: "카드사",
      contact: null,
      priority: 100,
    });
  }

  if (hasPhone) {
    addRule(rules, {
      id: "secure-mobile-device",
      title: "휴대폰 회선 정지 및 원격 잠금",
      description:
        "통신사에 분실 신고하고 가능한 경우 기기 찾기 기능으로 원격 잠금을 설정하세요.",
      reason: "계정 탈취, 인증번호 수신, 통신요금 피해를 줄이기 위한 조치입니다.",
      preparations: ["통신사 정보", "기기 계정 접근 수단", "기기 식별정보"],
      institutionName: "통신사",
      contact: null,
      priority: 95,
    });
  }

  if (input.type === "STOLEN" || hasPassport) {
    addRule(rules, {
      id: "report-to-police",
      title: "현지 경찰에 사건 신고",
      description:
        "사건 시간·장소·물품 특징을 정리해 현지 경찰에 신고하세요.",
      reason:
        hasPassport
          ? "여권 재발급과 사건 증빙에 경찰 신고 기록이 필요할 수 있습니다."
          : "도난 사실을 공식적으로 기록하고 후속 절차의 증빙을 확보하기 위한 단계입니다.",
      preparations: ["사건 발생 시간과 장소", "물품 목록과 특징"],
      institutionName: "현지 경찰",
      contact: null,
      priority: 90,
    });
  }

  if (input.type === "LOST") {
    addRule(rules, {
      id: "contact-last-seen-location",
      title: "마지막 확인 장소와 분실물 센터에 문의",
      description:
        "마지막으로 물품을 확인한 장소와 인근 분실물 센터에 보관 여부를 문의하세요.",
      reason: "단순 분실은 이동 경로와 마지막 확인 장소에서 발견될 가능성이 있습니다.",
      preparations: ["마지막 확인 시간과 장소", "물품 목록과 특징"],
      institutionName: "시설 관리처 또는 분실물 센터",
      contact: null,
      priority: 80,
    });
  }

  if (input.type === "UNKNOWN") {
    addRule(rules, {
      id: "confirm-incident-type",
      title: "분실·도난 정황 확인",
      description:
        "마지막 확인 시점부터 발견 시점까지의 이동 경로와 도난 정황을 확인하세요.",
      reason: "분실과 도난 여부에 따라 경찰 신고 등 다음 절차가 달라집니다.",
      preparations: ["마지막 확인 시간과 장소", "발견 시간과 장소"],
      institutionName: null,
      contact: null,
      priority: 80,
    });
  }

  if (hasPassport) {
    addRule(rules, {
      id: "contact-consular-office",
      title: "대사관 또는 영사관에 여권 분실 신고",
      description:
        "가까운 대사관 또는 영사관에 연락해 긴급여권이나 여행증명서 절차를 확인하세요.",
      reason: "출국과 신원 확인에 필요한 여행문서를 다시 발급받아야 합니다.",
      preparations: ["경찰 신고 기록", "여권 사본 또는 여권 정보", "여행 일정"],
      institutionName: "대사관 또는 영사관",
      contact: null,
      priority: 70,
    });
  }

  addRule(rules, {
    id: "preserve-incident-records",
    title: "사건 정보와 처리 기록 보관",
    description:
      "사건 시간·장소·물품 목록과 신고 과정에서 받은 접수정보를 정리해 보관하세요.",
    reason: "경찰, 기관, 보험 문의 등 이후 절차에서 동일한 정보가 필요합니다.",
    preparations: ["사건 정보", "물품 목록", "기관 접수정보"],
    institutionName: null,
    contact: null,
    priority: 50,
  });

  const orderedSteps = [...rules.values()]
    .sort((left, right) => {
      return right.priority - left.priority || left.id.localeCompare(right.id);
    })
    .map(({ id: _id, ...rule }, index) => ({
      ...rule,
      stepOrder: index + 1,
    }));

  return guideStepDraftListSchema.parse(orderedSteps);
}
