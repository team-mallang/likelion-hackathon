import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, Linking } from "react-native";
import { insuranceProductsNavigationState } from "@/features/insurance-products/services/insuranceProductsNavigation";
import { createMockInsuranceProductsService } from "@/features/insurance-products/services/mockInsuranceProducts";
import { isAllowedInsuranceProductUrl } from "@/features/insurance-products/services/insuranceProducts";
import type { PartnerInsuranceProduct } from "@/features/insurance-products/types/insuranceProducts";
import { InsuranceProductsView } from "@/features/insurance-products/views/InsuranceProductsView";

export function InsuranceProductsScreen() {
  const router = useRouter();
  const service = useMemo(() => createMockInsuranceProductsService(), []);
  const [products, setProducts] = useState<PartnerInsuranceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasTravelInsurance, setHasTravelInsurance] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  useEffect(() => { void service.listActiveProducts().then((result) => setProducts(result.products)).catch(() => setErrorMessage("보험상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.")).finally(() => setIsLoading(false)); return () => insuranceProductsNavigationState.clearTarget(); }, [service]);
  const selected = products.find((product) => product.id === selectedProductId);
  function back(destination?: Href) { insuranceProductsNavigationState.clearTarget(); destination ? router.replace(destination) : router.back(); }
  async function openProduct() { if (!selected) return; if (!isAllowedInsuranceProductUrl(selected.detailUrl)) { Alert.alert("제휴 상품 안내", "상품 상세 페이지가 아직 준비되지 않았습니다."); return; } await Linking.openURL(selected.detailUrl!); }
  return <InsuranceProductsView products={products} isLoading={isLoading} errorMessage={errorMessage} hasTravelInsurance={hasTravelInsurance} selectedProductId={selectedProductId} onBack={() => back()} onToggleInsurance={setHasTravelInsurance} onSelectProduct={setSelectedProductId} onOpenProduct={() => void openProduct()} onCaseTab={() => back("/case" as Href)} onGuideTab={() => {}} onDocumentsTab={() => back("/case/documents" as Href)} />;
}
