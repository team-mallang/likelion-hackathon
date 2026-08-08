import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { colors, radius, spacing } from "@/theme/tokens";

import type { VoiceInputViewProps } from "./VoiceInputView.types";

export function VoiceInputView({
  statement,
  onBack,
  onRecordStart,
}: VoiceInputViewProps) {
  return (
    <>
      <FlowHeader
        onBack={onBack}
        step="3/6"
        title="분실·도난 신고"
      />

      <AppScreen>
        <View style={styles.container}>
          <View style={styles.introduction}>
            <Text style={styles.title}>
              무슨 일이 있었는지 알려주세요
            </Text>

            <Text style={styles.description}>
              사건 경위를 말씀해주시면 자동으로 신고서 초안을
              작성합니다.
            </Text>
          </View>

          <View style={styles.transcriptCard}>
            <Text style={styles.transcript}>
              {statement || "아직 입력된 사건 내용이 없습니다."}
            </Text>
          </View>

          <Button
            title="임시 음성 입력"
            onPress={onRecordStart}
          />
        </View>
      </AppScreen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  introduction: {
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    lineHeight: 34,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  transcriptCard: {
    minHeight: 120,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  transcript: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 23,
  },
});
