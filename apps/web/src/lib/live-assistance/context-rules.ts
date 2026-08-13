import type { LiveAssistanceIncidentContext } from "./incident-context";

export type ContextRuleResult = {
  matched: boolean;
  source?: "lastSeenAt" | "lastSeenPlace" | "item.color" | "item.brand" | "item.model" | "item.quantity";
  fact?: string;
};

const patterns = {
  lastSeenAt: /(?:마지막|언제|시간|몇s*시|when|last)/i,
  lastSeenPlace: /(?:어디|장소|위치|where|place)/i,
  color: /(?:색|색상|color)/i,
  brand: /(?:브랜드|상표|brand)/i,
  model: /(?:모델|model)/i,
  quantity: /(?:몇s*개|수량|몇s*장|quantity|how many)/i,
};

export function matchIncidentFact(
  statement: string,
  incident: LiveAssistanceIncidentContext,
): ContextRuleResult {
  const question = statement.trim();
  if (!question) return { matched: false };

  if (patterns.lastSeenAt.test(question) && incident.lastSeenAt) {
    return {
      matched: true,
      source: "lastSeenAt",
      fact: `마지막 확인 시각은 ${incident.lastSeenAt}입니다.`,
    };
  }

  if (patterns.lastSeenPlace.test(question) && incident.lastSeenPlace) {
    return {
      matched: true,
      source: "lastSeenPlace",
      fact: `마지막 확인 장소는 ${incident.lastSeenPlace}입니다.`,
    };
  }

  const item = incident.items[0];
  if (patterns.color.test(question) && item?.color) {
    return { matched: true, source: "item.color", fact: `${item.name} 색상은 ${item.color}입니다.` };
  }
  if (patterns.brand.test(question) && item?.brand) {
    return { matched: true, source: "item.brand", fact: `${item.name} 브랜드는 ${item.brand}입니다.` };
  }
  if (patterns.model.test(question) && item?.model) {
    return { matched: true, source: "item.model", fact: `${item.name} 모델은 ${item.model}입니다.` };
  }

  const quantityItem = incident.items.find(
    (candidate) => candidate.quantity > 0,
  );
  if (patterns.quantity.test(question) && quantityItem) {
    return {
      matched: true,
      source: "item.quantity",
      fact: `${quantityItem.name} 수량은 ${quantityItem.quantity}개입니다.`,
    };
  }

  return { matched: false };
}
