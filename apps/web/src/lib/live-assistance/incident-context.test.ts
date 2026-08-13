import assert from "node:assert/strict";
import { test } from "node:test";

import { toLiveAssistanceIncidentContext } from "./incident-context";

test("maps only live assistance fields from Case and CaseItem", () => {
  const context = toLiveAssistanceIncidentContext({
    type: "STOLEN", countryCode: "JP", lastSeenAt: new Date("2026-08-12T11:10:00.000Z"), lastSeenPlace: "Shinjuku Station",
    discoveredAt: new Date("2026-08-12T11:40:00.000Z"), discoveredPlace: "Shinjuku Station", description: "Theft discovered after leaving the station.",
    items: [{ category: "WALLET_BAG", name: "Wallet", color: "BLACK", brand: "GUCCI", model: null, identifyingFeature: "gold zipper", quantity: 1 }],
  } as never);
  assert.deepEqual(context, {
    type: "STOLEN", countryCode: "JP", lastSeenAt: "2026-08-12T11:10:00.000Z", lastSeenPlace: "Shinjuku Station",
    discoveredAt: "2026-08-12T11:40:00.000Z", discoveredPlace: "Shinjuku Station", description: "Theft discovered after leaving the station.",
    items: [{ category: "WALLET_BAG", name: "Wallet", color: "BLACK", brand: "GUCCI", model: null, identifyingFeature: "gold zipper", quantity: 1 }],
  });
});
