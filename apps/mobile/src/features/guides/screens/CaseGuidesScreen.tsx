import { useRouter, type Href } from "expo-router";
import { Alert } from "react-native";

import { AppScreen } from "@/components/layout/AppScreen";
import { CaseGuidesView } from "@/features/guides/views/CaseGuidesView";

export function CaseGuidesScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll={false}>
      <CaseGuidesView
        errorMessage={null}
        isLoading={false}
        onBack={() => router.back()}
        onCaseTab={() => Alert.alert("준비 중", "사건 화면은 준비 중입니다.")}
        onCompleteGuide={() => {}}
        onDocumentsTab={() => router.replace("/case/documents" as Href)}
        onGuideTab={() => {}}
        onRetry={() => {}}
        onRunGuideAction={() => {}}
        overview={null}
        updatingGuideId={null}
      />
    </AppScreen>
  );
}
