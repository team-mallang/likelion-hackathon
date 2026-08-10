import { useRouter } from "expo-router";

import { AppScreen } from "@/components/layout/AppScreen";
import { CaseGuidesView } from "@/features/guides/views/CaseGuidesView";

export function CaseGuidesScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll={false}>
      <CaseGuidesView onBack={() => router.back()} />
    </AppScreen>
  );
}
