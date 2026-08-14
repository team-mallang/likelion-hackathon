import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ActiveCaseProvider } from "@/features/case/context/ActiveCaseContext";
import { CaseDraftProvider } from "@/features/case/context/CaseDraftContext";
import { colors } from "@/theme/tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
