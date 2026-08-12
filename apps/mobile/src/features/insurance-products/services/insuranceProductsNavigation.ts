import type { InsuranceProductsNavigationTarget } from "@/features/insurance-products/types/insuranceProducts";
export type InsuranceProductsNavigationState = { target: InsuranceProductsNavigationTarget | null; setTarget: (target: InsuranceProductsNavigationTarget) => void; clearTarget: () => void };
let target: InsuranceProductsNavigationTarget | null = null;
export const insuranceProductsNavigationState: InsuranceProductsNavigationState = { get target() { return target; }, setTarget(nextTarget) { target = nextTarget; }, clearTarget() { target = null; } };
