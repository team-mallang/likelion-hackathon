import type { InsuranceProductsOverview, PartnerInsuranceProduct } from "@/features/insurance-products/types/insuranceProducts";
export type InsuranceProductsErrorCode = "PRODUCTS_UNAVAILABLE" | "INVALID_PRODUCT_LINK" | "PRODUCTS_TIMEOUT";
export class InsuranceProductsError extends Error { constructor(public readonly code: InsuranceProductsErrorCode, message: string) { super(message); this.name = "InsuranceProductsError"; } }
export type InsuranceProductsService = { listActiveProducts(): Promise<InsuranceProductsOverview> };
export function filterActiveInsuranceProducts(products: PartnerInsuranceProduct[]) { return products.filter((product) => product.status === "ACTIVE"); }
export function isAllowedInsuranceProductUrl(value: string | undefined) { if (!value) return false; try { return new URL(value).protocol === "https:"; } catch { return false; } }
