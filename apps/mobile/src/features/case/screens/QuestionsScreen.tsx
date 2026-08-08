import { useRouter, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { colors, radius, spacing } from "@/theme/tokens";

export function QuestionsScreen() {
  const router = useRouter();

  return (
    <>
      <FlowHeader step="5/6" title="추가 질문" />

      <AppScreen
        footer={
          <Button
            title="최종 확인하기"
            onPress={() => router.push("/case/confirmation" as Href)}
          />
        }
      >
        <View style={styles.container}>
          <Text style={styles.title}>추가 질문 화면</Text>
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              질문 생성과 답변 입력 기능은 다음 구현 단계에서 연결합니다.
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
  notice: {
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  noticeText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 23,
  },
});
