import { useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { getPoliceConversation } from "@/features/police-support/services/policeConversation";
import { colors, radius, spacing } from "@/theme/tokens";

export function PoliceConversationScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const entries = activeCase ? getPoliceConversation(activeCase.caseId) : [];

  if (!activeCase || entries.length === 0) {
    return (
      <AppScreen footer={<Button title="서류함으로 돌아가기" onPress={() => router.replace("/case/documents" as Href)} />}>
        <ErrorState message="표시할 경찰서 대화 기록이 없습니다." />
      </AppScreen>
    );
  }

  return (
    <AppScreen footer={<Button title="서류함으로 돌아가기" onPress={() => router.replace("/case/documents" as Href)} />}>
      <Text accessibilityRole="header" style={styles.title}>경찰서 대화</Text>
      <Text style={styles.description}>현장 대응 중 완료된 발화의 원문과 번역문입니다. 이 기록은 현재 앱 실행 중에만 보관됩니다.</Text>
      <View style={styles.list}>
        {entries.map((entry, index) => (
          <View key={entry.turnId} style={styles.card}>
            <Text style={styles.speaker}>{index + 1}. {entry.speakerRole === "TRAVELER" ? "여행자" : "경찰관"}</Text>
            <Text style={styles.label}>{entry.sourceLanguage === "ko-KR" ? "한국어 원문" : "일본어 원문"}</Text>
            <Text style={styles.original}>{entry.originalText}</Text>
            <Text style={styles.label}>{entry.targetLanguage === "ko-KR" ? "한국어 번역" : "일본어 번역"}</Text>
            <Text style={styles.translation}>{entry.translatedText}</Text>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: "800" },
  description: { marginTop: spacing.sm, color: colors.textSecondary, fontSize: 14, lineHeight: 21 },
  list: { gap: spacing.md, marginTop: spacing.lg },
  card: { gap: spacing.xs, padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.background },
  speaker: { color: colors.primary, fontSize: 14, fontWeight: "800" },
  label: { marginTop: spacing.xs, color: colors.textSecondary, fontSize: 12, fontWeight: "700" },
  original: { color: colors.text, fontSize: 16, lineHeight: 24 },
  translation: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
});
