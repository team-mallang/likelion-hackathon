import { useLocalSearchParams, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { formatCaseNumber } from "@/features/case/utils/formatCaseNumber";
import { colors, radius, spacing } from "@/theme/tokens";

export function CaseCompleteScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const params = useLocalSearchParams<{
    caseId?: string;
    caseNumber?: string;
  }>();
  const displayCaseNumber = params.caseNumber
    ? formatCaseNumber(params.caseNumber)
    : null;

  return (
    <>
      <FlowHeader title="저장 완료" showBack={false} />
      <AppScreen
        footer={
          <Button
            title="사건 카드 확인하기"
            onPress={() => router.replace("/case/card")}
            disabled={!activeCase?.accessToken}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>사건이 안전하게 저장되었습니다.</Text>
          <View style={styles.card}>
            <Text style={styles.label}>사건번호</Text>
            <Text selectable style={styles.caseNumber}>
              {displayCaseNumber ?? "사건번호를 확인할 수 없습니다."}
            </Text>
          </View>
          {params.caseId ? (
            <Text style={styles.reference}>접수 ID: {params.caseId}</Text>
          ) : null}
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", lineHeight: 32 },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  label: { color: colors.textSecondary, fontSize: 14 },
  caseNumber: { color: colors.primary, fontSize: 24, fontWeight: "800" },
  reference: { color: colors.textSecondary, fontSize: 13 },
});
