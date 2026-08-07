import { Stack } from "expo-router";

import { CaseDraftProvider } from "@/features/case/context/CaseDraftContext";
import { colors } from "@/theme/tokens";

export default function RootLayout() {
  return (
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
  );
}