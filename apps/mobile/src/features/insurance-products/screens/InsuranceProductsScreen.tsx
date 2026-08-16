import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { insuranceProductsNavigationState } from "@/features/insurance-products/services/insuranceProductsNavigation";
import { createMockInsuranceProductsService } from "@/features/insurance-products/services/mockInsuranceProducts";
import { isAllowedInsuranceProductUrl } from "@/features/insurance-products/services/insuranceProducts";
import type { InsuranceCategory, PartnerInsuranceProduct } from "@/features/insurance-products/types/insuranceProducts";
import { InsuranceProductsView } from "@/features/insurance-products/views/InsuranceProductsView";

export function InsuranceProductsScreen() {
  const router = useRouter();
  const service = useMemo(() => createMockInsuranceProductsService(), []);
  const [products, setProducts] = useState<PartnerInsuranceProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<InsuranceCategory>("ALL");
  useEffect(() => { void service.listActiveProducts().then((result) => setProducts(result.products)).catch(() => setErrorMessage("보험상품 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.")).finally(() => setIsLoading(false)); return () => insuranceProductsNavigationState.clearTarget(); }, [service]);
  const selected = products.find((product) => product.id === selectedProductId);
  function back(destination?: Href) { insuranceProductsNavigationState.clearTarget(); destination ? router.replace(destination) : router.back(); }
  const visibleProducts = selectedCategory === "ALL" ? products : products.filter((product) => product.categories?.includes(selectedCategory));
  function openProduct() {
    if (!selected) return;
    if (isAllowedInsuranceProductUrl(selected.detailUrl)) return;
    Alert.alert("시연용 상품 안내", `${selected.insurerName} ${selected.productName}\n\n${selected.recommendationTarget ?? "여행자를 위한 샘플 상품"}\n\n주요 보장 예시\n${selected.coverageExamples?.join("\n") ?? "데모용 보장 정보"}\n\n현재 시연용 상품입니다. 실제 서비스에서는 제휴 보험사의 가입 페이지로 이동합니다.`);
  }
  return <InsuranceProductsView products={visibleProducts} isLoading={isLoading} errorMessage={errorMessage} hasTravelInsurance={false} selectedProductId={selectedProductId} selectedCategory={selectedCategory} onBack={() => back()} onToggleInsurance={() => {}} onSelectProduct={setSelectedProductId} onSelectCategory={setSelectedCategory} onOpenProduct={openProduct} onCaseTab={() => back("/case" as Href)} onGuideTab={() => {}} onDocumentsTab={() => back("/case/documents" as Href)} />;
}
