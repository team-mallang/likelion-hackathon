import { Stack } from "expo-router";

import { ActiveCaseProvider } from "@/features/case/context/ActiveCaseContext";
import { CaseDraftProvider } from "@/features/case/context/CaseDraftContext";
import { colors } from "@/theme/tokens";

export default function RootLayout() {
  return (
    <ActiveCaseProvider>
      <CaseDraftProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        />
      </CaseDraftProvider>
    </ActiveCaseProvider>
  );
}
