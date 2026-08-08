import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { colors, radius, spacing } from "@/theme/tokens";

import type { VoiceInputViewProps } from "./VoiceInputView.types";

export function VoiceInputView({
  statement,
  recordingState,
  recordingTimeLabel,
  errorMessage,
  canOpenSettings,
  onBack,
  onInputModeChange,
  onOpenSettings,
  onRecordAgain,
  onRecordStart,
  onRecordStop,
}: VoiceInputViewProps) {
  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "requestingPermission";
  const isStopping = recordingState === "stopping";
  const isProcessing = recordingState === "processing";
  const recordButtonTitle = isRecording
    ? "녹음 중지"
    : isProcessing
      ? "음성 처리 중"
      : "음성 녹음 시작";

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

          {isRecording ? (
            <View style={styles.recordingStatus}>
              <View style={styles.recordingIndicator} />
              <Text style={styles.recordingStatusLabel}>녹음 중</Text>
              <Text style={styles.recordingTime}>
                {recordingTimeLabel}
              </Text>
            </View>
          ) : null}

          {errorMessage ? (
            <View accessibilityRole="alert" style={styles.errorContainer}>
              <Text style={styles.errorMessage}>{errorMessage}</Text>

              <View style={styles.errorActions}>
                <Button
                  title={
                    canOpenSettings ? "기기 설정 열기" : "다시 시도"
                  }
                  onPress={
                    canOpenSettings ? onOpenSettings : onRecordAgain
                  }
                  variant="outline"
                />
                <Button
                  title="텍스트로 입력"
                  onPress={() => onInputModeChange("text")}
                  variant="secondary"
                />
              </View>
            </View>
          ) : null}

          <Button
            title={recordButtonTitle}
            onPress={isRecording ? onRecordStop : onRecordStart}
            variant={isRecording ? "secondary" : "primary"}
            disabled={isProcessing}
            loading={isStarting || isStopping}
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
  recordingStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  recordingIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error,
  },
  recordingStatusLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  recordingTime: {
    color: colors.text,
    fontSize: 18,
    fontVariant: ["tabular-nums"],
    fontWeight: "700",
  },
  errorContainer: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  errorMessage: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 21,
  },
  errorActions: {
    gap: spacing.sm,
  },
});
