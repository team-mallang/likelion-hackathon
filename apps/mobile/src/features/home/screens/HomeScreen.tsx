import { useRouter, type Href } from "expo-router";
import { Alert } from "react-native";

import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { HomeView } from "@/features/home/views/HomeView";
import type { HomeQuickStartType } from "@/features/home/views/HomeView.types";

const quickStartDrafts = {
  passport: {
    initialStatement: "여권을 분실했어요.",
    item: { name: "여권", category: "PASSPORT", quantity: 1 },
  },
  card: {
    initialStatement: "카드를 분실했어요.",
    item: { name: "카드", category: "CARD", quantity: 1 },
  },
  phone: {
    initialStatement: "휴대폰을 분실했어요.",
    item: { name: "휴대폰", category: "PHONE", quantity: 1 },
  },
} as const;

export function HomeScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const { resetDraft, updateDraft } = useCaseDraft();

  function handleStartCase() {
    resetDraft();
    router.push("/case/new");
  }

  function handlePreviousCase() {
    router.push("/case/lookup" as Href);
  }

  function handleQuickStart(type: HomeQuickStartType) {
    const quickStart = quickStartDrafts[type];

    resetDraft();
    updateDraft({
      initialStatement: quickStart.initialStatement,
      type: "LOST",
      items: [quickStart.item],
    });

    if (type === "card") {
      router.push("/quick-guide/card-loss" as Href);
      return;
    }

    router.push("/case/new");
  }

  function handleDocumentsTab() {
    if (activeCase?.caseId && activeCase.caseNumber) {
      router.push("/case/documents" as Href);
      return;
    }

    Alert.alert(
      "활성 사건 없음",
      "사건을 먼저 시작하거나 이전 사건을 조회해주세요.",
    );
  }

  function handleGuideTab() {
    if (activeCase?.caseId && activeCase.caseNumber) {
      router.push("/case/guides" as Href);
      return;
    }

    Alert.alert(
      "활성 사건 없음",
      "사건을 먼저 시작하거나 이전 사건을 조회해주세요.",
    );
  }

  function handleMapTab() {
    if (activeCase?.caseId && activeCase.caseNumber) {
      router.push("/case/nearby-agencies?autoLocate=1" as Href);
      return;
    }

    Alert.alert(
      "활성 사건 없음",
      "사건을 먼저 시작하거나 이전 사건을 조회해주세요.",
    );
  }

  return (
    <HomeView
      onDocuments={handleDocumentsTab}
      onGuide={handleGuideTab}
      onMap={handleMapTab}
      onPreviousCase={handlePreviousCase}
      onQuickStart={handleQuickStart}
      onStartCase={handleStartCase}
    />
  );
}
