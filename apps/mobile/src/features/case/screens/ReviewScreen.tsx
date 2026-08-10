import { useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { colors, radius, spacing } from "@/theme/tokens";

export function ReviewScreen() {
  const router = useRouter();
  const { draft } = useCaseDraft();

  return (
    <>
      <FlowHeader step="4/6" title="내용 확인" />

      <AppScreen
        footer={
          <Button
            title="질문 확인하기"
            onPress={() => router.push("/case/questions" as Href)}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>입력한 사건 내용을 확인해 주세요.</Text>
          <View style={styles.card}>
            <Text style={styles.statement}>
              {draft.initialStatement || "아직 입력된 사건 내용이 없습니다."}
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
    minHeight: 120,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  statement: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
});
