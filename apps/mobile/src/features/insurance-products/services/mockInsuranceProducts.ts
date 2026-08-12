import type { PartnerInsuranceProduct } from "@/features/insurance-products/types/insuranceProducts";
import { filterActiveInsuranceProducts, type InsuranceProductsService } from "./insuranceProducts";
const defaultProducts: PartnerInsuranceProduct[] = [
  { id: "partner-samsung", insurerName: "삼성화재", productName: "제휴 여행자보험", status: "ACTIVE", disclosureLabel: "제휴 상품" },
  { id: "partner-hyundai", insurerName: "현대해상", productName: "제휴 여행자보험", status: "ACTIVE", disclosureLabel: "제휴 상품" },
  { id: "inactive-sample", insurerName: "운영 종료 보험사", productName: "이전 상품", status: "INACTIVE", disclosureLabel: "운영 종료" },
];
export function createMockInsuranceProductsService(options?: { products?: PartnerInsuranceProduct[]; fail?: boolean }): InsuranceProductsService { return { async listActiveProducts() { if (options?.fail) throw new Error("provider details hidden"); return { products: filterActiveInsuranceProducts(options?.products ?? defaultProducts) }; } }; }
