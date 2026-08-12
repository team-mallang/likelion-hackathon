import type { PartnerInsuranceProduct } from "@/features/insurance-products/types/insuranceProducts";

export type InsuranceProductsViewProps = {
  products: PartnerInsuranceProduct[];
  isLoading: boolean;
  errorMessage: string | null;
  hasTravelInsurance: boolean;
  selectedProductId: string | null;
  onBack: () => void;
  onToggleInsurance: (value: boolean) => void;
  onSelectProduct: (id: string) => void;
  onOpenProduct: () => void;
  onCaseTab: () => void;
  onGuideTab: () => void;
  onDocumentsTab: () => void;
};
