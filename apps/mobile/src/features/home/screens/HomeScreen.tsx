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
    Alert.alert(
      "준비 중",
      "이전 사건 조회는 S19 화면 정의 후 연결할 예정입니다.",
    );
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
