import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { colors, radius, spacing } from "@/theme/tokens";

export function ConfirmationScreen() {
  const router = useRouter();
  const { draft } = useCaseDraft();

  return (
    <>
      <FlowHeader step="6/6" title="최종 확인" />

      <AppScreen
        footer={
          <Button title="처음으로" onPress={() => router.replace("/")} />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>사건 내용을 최종 확인해 주세요.</Text>
          <View style={styles.card}>
            <Text style={styles.label}>사건 설명</Text>
            <Text style={styles.value}>
              {draft.statement || "입력된 내용이 없습니다."}
            </Text>
          </View>
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    lineHeight: 32,
  },
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
});
