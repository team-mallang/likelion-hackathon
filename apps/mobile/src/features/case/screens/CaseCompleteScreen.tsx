import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

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
  const [isCaseNumberCopied, setIsCaseNumberCopied] = useState(false);

  async function handleCopyCaseNumber() {
    if (!displayCaseNumber) return;

    await Clipboard.setStringAsync(displayCaseNumber);
    setIsCaseNumberCopied(true);
  }

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
            <View style={styles.caseNumberRow}>
              <Text
                selectable
                accessibilityHint="사건번호를 복사합니다."
                accessibilityLabel={
                  displayCaseNumber
                    ? `사건번호 ${displayCaseNumber} 복사`
                    : "사건번호 확인 불가"
                }
                accessibilityRole="button"
                disabled={!displayCaseNumber}
                onPress={() => void handleCopyCaseNumber()}
                style={styles.caseNumber}
              >
                {displayCaseNumber ?? "사건번호를 확인할 수 없습니다."}
              </Text>
              {displayCaseNumber ? (
                <Pressable
                  accessibilityLabel="사건번호 복사하기"
                  accessibilityRole="button"
                  onPress={() => void handleCopyCaseNumber()}
                  style={styles.copyButton}
                >
                  <Ionicons color={colors.primary} name="copy-outline" size={18} />
                  <Text style={styles.copyButtonLabel}>
                    {isCaseNumberCopied ? "복사됨" : "복사"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
            {isCaseNumberCopied ? (
              <Text accessibilityLiveRegion="polite" style={styles.copyFeedback}>
                클립보드에 복사했습니다.
              </Text>
            ) : null}
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
  caseNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  caseNumber: { color: colors.primary, fontSize: 24, fontWeight: "800" },
  copyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minHeight: 36,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  copyButtonLabel: { color: colors.primary, fontSize: 14, fontWeight: "700" },
  copyFeedback: { color: colors.textSecondary, fontSize: 13 },
  reference: { color: colors.textSecondary, fontSize: 13 },
});
