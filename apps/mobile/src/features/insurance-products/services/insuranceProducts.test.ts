import assert from "node:assert/strict";
import test from "node:test";
import { filterActiveInsuranceProducts, isAllowedInsuranceProductUrl } from "./insuranceProducts";
import { createMockInsuranceProductsService } from "./mockInsuranceProducts";
test("S17 mock exposes only active partner products", async () => { const result = await createMockInsuranceProductsService().listActiveProducts(); assert.equal(result.products.length, 2); assert.equal(result.products.some((product) => product.status === "INACTIVE"), false); });
test("S17 supports empty products and safe failure", async () => { assert.deepEqual((await createMockInsuranceProductsService({ products: [] }).listActiveProducts()).products, []); await assert.rejects(() => createMockInsuranceProductsService({ fail: true }).listActiveProducts()); });
test("S17 accepts HTTPS links only", () => { assert.equal(isAllowedInsuranceProductUrl("https://partner.example.com/travel"), true); assert.equal(isAllowedInsuranceProductUrl("javascript:alert(1)"), false); assert.equal(filterActiveInsuranceProducts([]).length, 0); });
