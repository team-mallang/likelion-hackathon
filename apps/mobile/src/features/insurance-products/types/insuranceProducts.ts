export type InsuranceProductStatus = "ACTIVE" | "INACTIVE";
export type PartnerInsuranceProduct = { id: string; insurerName: string; productName: string; logoAsset?: string; detailUrl?: string; status: InsuranceProductStatus; disclosureLabel: string };
export type InsuranceProductsOverview = { products: PartnerInsuranceProduct[]; updatedAt?: string };
export type InsuranceProductsNavigationTarget = { source: "S06_DOCUMENTS" };
