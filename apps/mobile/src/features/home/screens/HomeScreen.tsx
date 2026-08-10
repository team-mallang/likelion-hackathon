import { useRouter, type Href } from "expo-router";
import { Alert } from "react-native";

import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { HomeView } from "@/features/home/views/HomeView";

export function HomeScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const { resetDraft } = useCaseDraft();

  function handleStartCase() {
    resetDraft();
    router.push("/case/new");
  }

  function handlePreviousCase() {
    router.push("/case/lookup" as Href);
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
    Alert.alert(
      "활성 사건 없음",
      "사건을 먼저 시작하거나 이전 사건을 조회해주세요.",
    );
  }

  return (
    <HomeView
      onDocuments={handleDocumentsTab}
      onGuide={handleGuideTab}
      onPreviousCase={handlePreviousCase}
      onStartCase={handleStartCase}
    />
  );
}
