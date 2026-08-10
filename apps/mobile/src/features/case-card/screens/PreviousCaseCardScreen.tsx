import { useRouter } from "expo-router";

import { AppScreen } from "@/components/layout/AppScreen";
import { PreviousCaseCardView } from "@/features/case-card/views/PreviousCaseCardView";

export function PreviousCaseCardScreen() {
  const router = useRouter();

  return (
    <AppScreen scroll={false}>
      <PreviousCaseCardView onBack={() => router.back()} />
    </AppScreen>
  );
}
