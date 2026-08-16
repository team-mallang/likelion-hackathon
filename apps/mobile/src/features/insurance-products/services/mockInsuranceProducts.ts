import type { PartnerInsuranceProduct } from "@/features/insurance-products/types/insuranceProducts";
import { demoInsuranceProducts } from "@/features/insurance-products/data/insuranceProducts";
import { filterActiveInsuranceProducts, type InsuranceProductsService } from "./insuranceProducts";
export function createMockInsuranceProductsService(options?: { products?: PartnerInsuranceProduct[]; fail?: boolean }): InsuranceProductsService { return { async listActiveProducts() { if (options?.fail) throw new Error("provider details hidden"); return { products: filterActiveInsuranceProducts(options?.products ?? demoInsuranceProducts) }; } }; }
