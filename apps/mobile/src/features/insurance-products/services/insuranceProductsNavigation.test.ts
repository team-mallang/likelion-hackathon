import assert from "node:assert/strict";
import test from "node:test";
import { insuranceProductsNavigationState } from "./insuranceProductsNavigation";
test("S06 to S17 carries only source", () => { insuranceProductsNavigationState.setTarget({ source: "S06_DOCUMENTS" }); assert.deepEqual(insuranceProductsNavigationState.target, { source: "S06_DOCUMENTS" }); assert.equal("caseId" in (insuranceProductsNavigationState.target ?? {}), false); insuranceProductsNavigationState.clearTarget(); });
