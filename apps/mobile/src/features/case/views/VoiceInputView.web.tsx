import { Pressable, StyleSheet, Text, View } from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { colors, radius, spacing } from "@/theme/tokens";

import type { VoiceInputViewProps } from "./VoiceInputView.types";

export function VoiceInputView({
  statement,
  inputMode,
  recordingState,
  recordingTimeLabel,
  locationText,
localTimeText,
  errorMessage,
  canOpenSettings,
  canContinue,
  onBack,
  onContinue,
  onInputModeChange,
  onOpenSettings,
  onRecordAgain,
  onRecordStart,
  onRecordStop,
  onStatementChange,
}: VoiceInputViewProps) {
  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "requestingPermission";
  const isStopping = recordingState === "stopping";
  const isProcessing = recordingState === "processing";
  const isModeChangeDisabled =
    isStarting || isStopping || isProcessing;
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

      <AppScreen
      >
   
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

          

          {inputMode === "voice" ? (
            <View style={styles.inputSection}>
              <View style={styles.micArea}>
  <View style={styles.micOuterCircle}>
    <View style={styles.micInnerCircle}>
      <Text style={styles.micIcon}>🎙</Text>
    </View>
  </View>
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
                <View
                  accessibilityRole="alert"
                  style={styles.errorContainer}
                >
                  <Text style={styles.errorMessage}>{errorMessage}</Text>

                  <View style={styles.errorActions}>
                    <Button
                      title={
                        canOpenSettings
                          ? "기기 설정 열기"
                          : "다시 시도"
                      }
                      onPress={
                        canOpenSettings
                          ? onOpenSettings
                          : onRecordAgain
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
              <View style={styles.secondaryActions}>
  <View style={styles.secondaryActionItem}>
    <Button
      title="다시 녹음"
      onPress={onRecordAgain}
      variant="outline"
    />
  </View>

  <View style={styles.secondaryActionItem}>
    <Button
      title="텍스트 입력"
      onPress={() => onInputModeChange("text")}
      variant="outline"
    />
  </View>
</View>

<View style={styles.infoRow}>
  <View style={styles.infoItem}>
    <Text style={styles.infoIcon}>⌖</Text>
    <Text style={styles.infoText}>
      현재 위치: {locationText}
    </Text>
  </View>

  <View style={styles.infoItem}>
    <Text style={styles.infoIcon}>◷</Text>
    <Text style={styles.infoText}>
      현지 시간: {localTimeText}
    </Text>
  </View>
</View>

<Text style={styles.offlineNotice}>
  ⓘ 오프라인 환경에서도 음성 인식이 가능합니다.
</Text>
<Text style={styles.offlineNotice}>
  오프라인 환경에서도 음성 인식이 가능합니다.
</Text>

<Button
  title="입력 내용 확인하기 →"
  onPress={onContinue}
  disabled={!canContinue}
/>
</View>
) : (
  <View style={styles.inputSection}>
    <Text style={styles.textInputDescription}>
      분실·도난 상황을 시간과 장소를 포함해 직접 입력해
      주세요.
    </Text>
    

    <AppTextInput
      label="사건 내용"
      multiline
      onChangeText={onStatementChange}
      placeholder="예: 오늘 오후 신주쿠역에서 지갑을 잃어버렸어요."
      style={styles.statementInput}
      textAlignVertical="top"
      value={statement}
    />
  </View>
)}
</View>
</AppScreen>
</>
);
}

const styles = StyleSheet.create({
  offlineNotice: {
  width: "100%",
  marginTop: 4,
  color: "#9CA3AF",
  fontSize: 12,
  textAlign: "left",
},
  infoRow: {
  width: "100%",
  flexDirection: "row",
  gap: 10,
},

infoItem: {
  flex: 1,
  minHeight: 52,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  paddingHorizontal: 12,
  borderWidth: 1,
  borderColor: "#E5E7EB",
  borderRadius: 10,
  backgroundColor: "#FFFFFF",
},

infoIcon: {
  color: "#6B7280",
  fontSize: 17,
},

infoText: {
  color: "#374151",
  fontSize: 13,
  fontWeight: "600",
},
  secondaryActionItem: {
  flex: 1,
},
  secondaryActions: {
  flexDirection: "row",
  gap: 10,
  width: "100%",
},
  micArea: {
  alignItems: "center",
  justifyContent: "center",
  marginTop: 28,
  marginBottom: 8,
},

micOuterCircle: {
  width: 150,
  height: 150,
  borderRadius: 75,
  borderWidth: 2,
  borderColor: "#2563EB",
  alignItems: "center",
  justifyContent: "center",
},

micInnerCircle: {
  width: 112,
  height: 112,
  borderRadius: 56,
  backgroundColor: "#2563EB",
  alignItems: "center",
  justifyContent: "center",
},

micIcon: {
  fontSize: 42,
  color: "#FFFFFF",
},
  flowHeader: {
  width: "100%",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 2,
  marginBottom: 28,
},

backButton: {
  color: "#2563EB",
  fontSize: 24,
  fontWeight: "600",
},

flowTitle: {
  color: "#111827",
  fontSize: 16,
  fontWeight: "800",
},

flowStep: {
  color: "#2563EB",
  fontSize: 15,
  fontWeight: "800",
},
  container: {
  width: "100%",
  maxWidth: 430,
  alignSelf: "center",
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
  modeSelector: {
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  modeButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    borderRadius: radius.sm,
  },
  modeButtonSelected: {
    backgroundColor: colors.primary,
  },
  modeButtonPressed: {
    opacity: 0.8,
  },
  modeButtonDisabled: {
    opacity: 0.55,
  },
  modeButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700",
  },
  modeButtonTextSelected: {
    color: colors.background,
  },
  inputSection: {
    gap: spacing.lg,
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
  textInputDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  statementInput: {
    minHeight: 180,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
});
