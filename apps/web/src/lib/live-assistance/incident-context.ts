import type { Prisma } from "@project/db";

export type LiveAssistanceItemContext = {
  category: string | null;
  name: string;
  color: string | null;
  brand: string | null;
  model: string | null;
  identifyingFeature: string | null;
  quantity: number;
};

export type LiveAssistanceIncidentContext = {
  type: string;
  countryCode: string | null;
  lastSeenAt: string | null;
  lastSeenPlace: string | null;
  discoveredAt: string | null;
  discoveredPlace: string | null;
  description: string | null;
  items: readonly LiveAssistanceItemContext[];
};

export const liveAssistanceCaseSelect = {
  type: true,
  countryCode: true,
  lastSeenAt: true,
  lastSeenPlace: true,
  discoveredAt: true,
  discoveredPlace: true,
  description: true,
  items: {
    select: {
      category: true,
      name: true,
      color: true,
      brand: true,
      model: true,
      identifyingFeature: true,
      quantity: true,
    },
  },
} satisfies Prisma.CaseSelect;

export function toLiveAssistanceIncidentContext(caseData: Prisma.CaseGetPayload<{
  select: typeof liveAssistanceCaseSelect;
}>): LiveAssistanceIncidentContext {
  return {
    type: caseData.type,
    countryCode: caseData.countryCode,
    lastSeenAt: caseData.lastSeenAt?.toISOString() ?? null,
    lastSeenPlace: caseData.lastSeenPlace,
    discoveredAt: caseData.discoveredAt?.toISOString() ?? null,
    discoveredPlace: caseData.discoveredPlace,
    description: caseData.description,
    items: caseData.items.map((item) => ({ ...item })),
  };
}
