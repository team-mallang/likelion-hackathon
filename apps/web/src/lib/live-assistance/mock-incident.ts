export const mockIncident = {
  type: "STOLEN",
  countryCode: "JP",
  lastSeenAt: "20:10",
  lastSeenPlace: "Shinjuku Station",
  discoveredAt: "20:40",
  discoveredPlace: "Shinjuku Station",
  description: null,
  items: [
    {
      category: "WALLET_BAG",
      name: "지갑",
      color: "BLACK",
      brand: "GUCCI",
      model: null,
      identifyingFeature: null,
      quantity: 1,
    },
    {
      category: "CARD",
      name: "신용카드",
      color: null,
      brand: null,
      model: null,
      identifyingFeature: null,
      quantity: 2,
    },
  ],
} as const;

export type MockIncident = typeof mockIncident;
