import type { InsuranceProductsOverview, PartnerInsuranceProduct } from "@/features/insurance-products/types/insuranceProducts";
import { InsuranceProductsError, filterActiveInsuranceProducts, isAllowedInsuranceProductUrl, type InsuranceProductsService } from "./insuranceProducts";

type PartnerProductsResponse = { products?: Array<Partial<PartnerInsuranceProduct>>; updatedAt?: string };

export function createPartnerInsuranceProductsService(input: { endpoint: string; fetcher?: typeof fetch; allowedHosts: string[] }): InsuranceProductsService {
  const fetcher = input.fetcher ?? fetch;
  return { async listActiveProducts(): Promise<InsuranceProductsOverview> {
    let response: Response;
    try { response = await fetcher(input.endpoint); } catch { throw new InsuranceProductsError("PRODUCTS_UNAVAILABLE", "보험상품 정보를 불러오지 못했습니다."); }
    if (!response.ok) throw new InsuranceProductsError("PRODUCTS_UNAVAILABLE", "보험상품 정보를 불러오지 못했습니다.");
    let payload: PartnerProductsResponse;
    try { payload = await response.json() as PartnerProductsResponse; } catch { throw new InsuranceProductsError("PRODUCTS_UNAVAILABLE", "보험상품 정보를 확인하지 못했습니다."); }
    const products = (payload.products ?? []).filter((product): product is PartnerInsuranceProduct => Boolean(product.id && product.insurerName && product.productName && product.status === "ACTIVE" && product.disclosureLabel));
    const safeProducts = filterActiveInsuranceProducts(products).map((product) => ({ ...product, detailUrl: product.detailUrl && isAllowedInsuranceProductUrl(product.detailUrl) && input.allowedHosts.includes(new URL(product.detailUrl).host) ? product.detailUrl : undefined }));
    return { products: safeProducts, updatedAt: payload.updatedAt };
  } };
}
