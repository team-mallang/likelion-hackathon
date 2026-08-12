import assert from "node:assert/strict";
import test from "node:test";
import { createPartnerInsuranceProductsService } from "./partnerInsuranceProducts";

test("S17 partner adapter filters invalid products and non-allowlisted links", async () => {
  const service = createPartnerInsuranceProductsService({ endpoint: "https://api.example.com/products", allowedHosts: ["partner.example.com"], fetcher: async () => new Response(JSON.stringify({ products: [
    { id: "ok", insurerName: "제휴사", productName: "여행자보험", status: "ACTIVE", disclosureLabel: "제휴 상품", detailUrl: "https://evil.example.com" },
    { id: "inactive", insurerName: "종료사", productName: "이전 상품", status: "INACTIVE", disclosureLabel: "종료" },
  ] })) });
  const result = await service.listActiveProducts();
  assert.equal(result.products.length, 1);
  assert.equal(result.products[0]?.detailUrl, undefined);
});

test("S17 partner adapter maps provider failures to safe errors", async () => {
  const service = createPartnerInsuranceProductsService({ endpoint: "https://api.example.com/products", allowedHosts: [], fetcher: async () => { throw new Error("secret provider error"); } });
  await assert.rejects(() => service.listActiveProducts(), { code: "PRODUCTS_UNAVAILABLE" });
});
