import { useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Button } from "@/components/common/button";
import { AppTextInput } from "@/components/forms/AppTextInput";
import { AppScreen } from "@/components/layout/AppScreen";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { colors, radius, spacing } from "@/theme/tokens";

import type { VoiceInputViewProps } from "./VoiceInputView.types";

function getCompactTime(value: string) {
  return /(\d{2}:\d{2})/.exec(value)?.[1] ?? (value || "시간 미입력");
}

export function VoiceInputView({
  statement,
  inputMode,
  recordingState,
  recordingTimeLabel,
  locationText,
  localTimeText,
  locationState,
  isLocationEditorOpen,
  locationErrorMessage,
  canOpenLocationSettings,
  errorMessage,
  canOpenSettings,
  canContinue,
  onBack,
  onContinue,
  onInputModeChange,
  onLocationTextChange,
  onLocationEditorToggle,
  onOpenLocationSettings,
  onOpenSettings,
  onOccurredAtTextChange,
  onRecordAgain,
  onRecordStart,
  onRecordStop,
  onStatementChange,
  onUseCurrentLocation,
}: VoiceInputViewProps) {
  const isRecording = recordingState === "recording";
  const isStarting = recordingState === "requestingPermission";
  const isStopping = recordingState === "stopping";
  const isProcessing = recordingState === "processing";
  const isBusy = isStarting || isStopping || isProcessing;
  const isLocating =
    locationState === "requestingPermission" ||
    locationState === "loading";
  const hasStatement = statement.trim().length > 0;
  const canRetryRecording =
    isRecording || hasStatement || recordingState === "error";
  const microphoneLabel = isRecording
    ? "녹음 중지"
    : hasStatement
      ? "다시 녹음"
      : "음성 녹음 시작";

  function handleMicrophonePress() {
    if (isRecording) {
      onRecordStop();
      return;
    }

    if (hasStatement || recordingState === "error") {
      onRecordAgain();
      return;
    }

    onRecordStart();
  }

  return (
    <>
      <FlowHeader onBack={onBack} step="3/6" title="분실·도난 신고" />

      <AppScreen>
        <View style={styles.container}>
          <View style={styles.introduction}>
            <Text style={styles.title}>무슨 일이 있었는지 알려주세요</Text>
            <Text style={styles.description}>
              사건의 경위를 말씀해주시면 자동으로 신고서 초안을
              작성합니다.
            </Text>
          </View>

          {inputMode === "voice" ? (
            <View style={styles.voiceContent}>
              <View style={styles.microphoneStage}>
                <VoiceRipple isActive={isRecording} />

                <Pressable
                  accessibilityLabel={microphoneLabel}
                  accessibilityRole="button"
                  accessibilityState={{
                    busy: isBusy,
                    disabled: isBusy,
                  }}
                  disabled={isBusy}
                  onPress={handleMicrophonePress}
                  style={({ pressed }) => [
                    styles.microphoneButton,
                    pressed && !isBusy && styles.microphoneButtonPressed,
                    isBusy && styles.disabled,
                  ]}
                >
                  {isBusy ? (
                    <ActivityIndicator color={colors.background} size="large" />
                  ) : (
                    <MicrophoneIcon />
                  )}
                </Pressable>
              </View>

              <RecordingStatus
                hasStatement={hasStatement}
                recordingState={recordingState}
                recordingTimeLabel={recordingTimeLabel}
              />

              <View style={styles.transcriptCard}>
                <Text style={styles.transcript} numberOfLines={4}>
                  {statement
                    ? `“${statement}”`
                    : isRecording
                      ? "녹음이 끝나면 말씀하신 내용을 텍스트로 변환합니다."
                      : "마이크를 눌러 사건의 경위를 말씀해 주세요."}
                </Text>
              </View>

              {errorMessage ? (
                <View accessibilityRole="alert" style={styles.errorContainer}>
                  <Text style={styles.errorMessage}>{errorMessage}</Text>
                  {canOpenSettings ? (
                    <Button
                      title="기기 설정 열기"
                      onPress={onOpenSettings}
                      variant="outline"
                    />
                  ) : null}
                </View>
              ) : null}

              {isRecording ? (
                <PrimaryAction
                  icon="stop"
                  title="녹음 중지"
                  onPress={onRecordStop}
                />
              ) : isBusy ? (
                <PrimaryAction
                  loading
                  title={isProcessing ? "음성 처리 중" : "녹음 준비 중"}
                  onPress={onRecordStop}
                />
              ) : hasStatement ? (
                <PrimaryAction
                  title="입력 내용 확인하기  →"
                  onPress={onContinue}
                  disabled={!canContinue || isLocating}
                />
              ) : null}

              <View style={styles.secondaryActions}>
                <View style={styles.secondaryAction}>
                  <Button
                    title="↻  다시 녹음"
                    onPress={onRecordAgain}
                    variant="outline"
                    disabled={!canRetryRecording || isBusy}
                  />
                </View>
                <View style={styles.secondaryAction}>
                  <Button
                    title="⌨  텍스트 입력"
                    onPress={() => onInputModeChange("text")}
                    variant="outline"
                    disabled={isBusy}
                  />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.textContent}>
              <AppTextInput
                label="사건 내용"
                multiline
                onChangeText={onStatementChange}
                placeholder="예: 오늘 오후 신주쿠역에서 지갑을 잃어버렸어요."
                style={styles.statementInput}
                textAlignVertical="top"
                value={statement}
              />

              <View style={styles.textModeActions}>
                <View style={styles.secondaryAction}>
                  <Button
                    title="마이크로 입력"
                    onPress={() => onInputModeChange("voice")}
                    variant="outline"
                  />
                </View>
                <View style={styles.secondaryAction}>
                  <Button
                    title="입력 내용 확인"
                    onPress={onContinue}
                    disabled={!canContinue || isLocating}
                  />
                </View>
              </View>
            </View>
          )}

          <View style={styles.locationArea}>
            <View style={styles.compactInfoRow}>
              <CompactInfo
                icon="⌖"
                label="현재 위치"
                value={locationText || "위치 확인"}
                onPress={onLocationEditorToggle}
              />
              <CompactInfo
                icon="◷"
                label="현지 시간"
                value={getCompactTime(localTimeText)}
                onPress={onLocationEditorToggle}
              />
            </View>

            {isLocationEditorOpen ? (
              <View style={styles.locationEditor}>
                <View style={styles.locationEditorHeading}>
                  <View style={styles.locationEditorHeadingText}>
                    <Text style={styles.locationEditorTitle}>장소와 시간 수정</Text>
                    <Text style={styles.locationEditorDescription}>
                      현재 위치를 다시 확인하거나 직접 입력할 수 있습니다.
                    </Text>
                  </View>
                  <Pressable
                    accessibilityLabel="장소와 시간 수정 닫기"
                    accessibilityRole="button"
                    hitSlop={10}
                    onPress={onLocationEditorToggle}
                  >
                    <Text style={styles.closeButton}>×</Text>
                  </Pressable>
                </View>

                <Button
                  title={
                    locationState === "success"
                      ? "현재 위치 다시 확인"
                      : "현재 위치 사용"
                  }
                  onPress={onUseCurrentLocation}
                  variant="outline"
                  loading={isLocating}
                />

                {locationErrorMessage ? (
                  <View
                    accessibilityRole="alert"
                    style={styles.locationErrorContainer}
                  >
                    <Text style={styles.errorMessage}>
                      {locationErrorMessage}
                    </Text>
                    {canOpenLocationSettings ? (
                      <Button
                        title="기기 설정 열기"
                        onPress={onOpenLocationSettings}
                        variant="outline"
                      />
                    ) : null}
                  </View>
                ) : null}

                <AppTextInput
                  label="사건 발생 장소"
                  onChangeText={onLocationTextChange}
                  placeholder="예: 일본 도쿄 신주쿠역 동쪽 출구"
                  value={locationText}
                />
                <AppTextInput
                  label="사건 발생 시간"
                  onChangeText={onOccurredAtTextChange}
                  placeholder="예: 2026. 08. 09. 14:30"
                  value={localTimeText}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.offlineNotice}>
            <Text style={styles.offlineIcon}>ⓘ</Text>
            <Text style={styles.offlineText}>
              네트워크가 불안정하면 텍스트로 계속 입력할 수 있습니다.
            </Text>
          </View>
        </View>
      </AppScreen>
    </>
  );
}

type VoiceRippleProps = {
  isActive: boolean;
};

function VoiceRipple({ isActive }: VoiceRippleProps) {
  const firstPulse = useRef(new Animated.Value(0)).current;
  const secondPulse = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (isMounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    firstPulse.setValue(0);
    secondPulse.setValue(0);

    if (!isActive || reduceMotion) {
      return;
    }

    function createPulse(value: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 1500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.delay(650 - delay),
        ]),
      );
    }

    const firstAnimation = createPulse(firstPulse, 0);
    const secondAnimation = createPulse(secondPulse, 650);

    firstAnimation.start();
    secondAnimation.start();

    return () => {
      firstAnimation.stop();
      secondAnimation.stop();
      firstPulse.setValue(0);
      secondPulse.setValue(0);
    };
  }, [firstPulse, isActive, reduceMotion, secondPulse]);

  if (isActive && reduceMotion) {
    return <View pointerEvents="none" style={styles.staticHalo} />;
  }

  if (!isActive) {
    return <View pointerEvents="none" style={styles.idleHalo} />;
  }

  return (
    <View pointerEvents="none" style={styles.rippleLayer}>
      {[firstPulse, secondPulse].map((value, index) => (
        <Animated.View
          key={index}
          style={[
            styles.ripple,
            {
              opacity: value.interpolate({
                inputRange: [0, 1],
                outputRange: [0.38, 0],
              }),
              transform: [
                {
                  scale: value.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.48],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
}

function MicrophoneIcon() {
  return (
    <View accessibilityElementsHidden style={styles.microphoneIcon}>
      <View style={styles.microphoneHead} />
      <View style={styles.microphoneArc} />
      <View style={styles.microphoneStem} />
      <View style={styles.microphoneBase} />
    </View>
  );
}

type RecordingStatusProps = {
  hasStatement: boolean;
  recordingState: VoiceInputViewProps["recordingState"];
  recordingTimeLabel: string;
};

function RecordingStatus({
  hasStatement,
  recordingState,
  recordingTimeLabel,
}: RecordingStatusProps) {
  const isRecording = recordingState === "recording";
  const statusLabel = isRecording
    ? "녹음 중..."
    : recordingState === "requestingPermission"
      ? "마이크 권한 확인 중"
      : recordingState === "stopping"
        ? "녹음을 정리하고 있어요"
        : recordingState === "processing"
          ? "음성을 텍스트로 변환하고 있어요"
          : recordingState === "error"
            ? "다시 시도해 주세요"
            : hasStatement
              ? "음성 인식 완료"
              : "눌러서 녹음을 시작하세요";

  return (
    <View style={styles.recordingStatus}>
      <View style={styles.recordingStatusLine}>
        <View
          style={[
            styles.statusDot,
            isRecording ? styles.recordingDot : styles.idleDot,
          ]}
        />
        <Text style={styles.recordingStatusLabel}>{statusLabel}</Text>
      </View>
      <Text style={styles.recordingTime}>{recordingTimeLabel}</Text>
    </View>
  );
}

type PrimaryActionProps = {
  title: string;
  onPress: () => void;
  icon?: "stop";
  loading?: boolean;
  disabled?: boolean;
};

function PrimaryAction({
  title,
  onPress,
  icon,
  loading = false,
  disabled = false,
}: PrimaryActionProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryAction,
        pressed && !isDisabled && styles.primaryActionPressed,
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.background} />
      ) : (
        <>
          {icon === "stop" ? <View style={styles.stopIcon} /> : null}
          <Text style={styles.primaryActionText}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

type CompactInfoProps = {
  icon: string;
  label: string;
  value: string;
  onPress: () => void;
};

function CompactInfo({ icon, label, value, onPress }: CompactInfoProps) {
  return (
    <Pressable
      accessibilityLabel={`${label}: ${value}. 수정하기`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.compactInfo,
        pressed && styles.compactInfoPressed,
      ]}
    >
      <Text style={styles.compactInfoIcon}>{icon}</Text>
      <Text numberOfLines={1} style={styles.compactInfoText}>
        <Text style={styles.compactInfoLabel}>{label}: </Text>
        {value}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  introduction: {
    gap: spacing.sm,
  },
  title: {
    maxWidth: 280,
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    lineHeight: 32,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  voiceContent: {
    gap: spacing.sm,
  },
  microphoneStage: {
    width: 148,
    height: 148,
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
  },
  rippleLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ripple: {
    position: "absolute",
    width: 104,
    height: 104,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 52,
    backgroundColor: colors.primarySoft,
  },
  idleHalo: {
    position: "absolute",
    width: 118,
    height: 118,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 59,
    opacity: 0.75,
  },
  staticHalo: {
    position: "absolute",
    width: 124,
    height: 124,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 62,
    backgroundColor: colors.primarySoft,
    opacity: 0.7,
  },
  microphoneButton: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 46,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.24,
    shadowRadius: 8,
    elevation: 7,
  },
  microphoneButtonPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.97 }],
  },
  microphoneIcon: {
    width: 32,
    height: 42,
    alignItems: "center",
  },
  microphoneHead: {
    width: 13,
    height: 23,
    borderRadius: 7,
    backgroundColor: colors.background,
  },
  microphoneArc: {
    position: "absolute",
    top: 9,
    width: 25,
    height: 23,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.background,
    borderRadius: 13,
  },
  microphoneStem: {
    width: 3,
    height: 8,
    backgroundColor: colors.background,
  },
  microphoneBase: {
    width: 15,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.background,
  },
  recordingStatus: {
    alignItems: "center",
    gap: spacing.xs,
  },
  recordingStatusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  recordingDot: {
    backgroundColor: colors.error,
  },
  idleDot: {
    backgroundColor: colors.disabled,
  },
  recordingStatusLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  recordingTime: {
    color: colors.primary,
    fontSize: 21,
    fontVariant: ["tabular-nums"],
    fontWeight: "900",
    letterSpacing: 1,
  },
  transcriptCard: {
    minHeight: 68,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.border,
    borderLeftColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
  },
  transcript: {
    color: colors.text,
    fontSize: 14,
    fontStyle: "italic",
    lineHeight: 21,
  },
  primaryAction: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },
  primaryActionPressed: {
    backgroundColor: colors.primaryPressed,
  },
  primaryActionText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: "800",
  },
  stopIcon: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: colors.background,
  },
  secondaryActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  secondaryAction: {
    flex: 1,
  },
  errorContainer: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  errorMessage: {
    color: colors.error,
    fontSize: 13,
    lineHeight: 19,
  },
  textContent: {
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  statementInput: {
    minHeight: 180,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  textModeActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  locationArea: {
    gap: spacing.sm,
  },
  compactInfoRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  compactInfo: {
    minWidth: 0,
    minHeight: 48,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  compactInfoPressed: {
    opacity: 0.75,
  },
  compactInfoIcon: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  compactInfoText: {
    minWidth: 0,
    flex: 1,
    color: colors.text,
    fontSize: 11,
  },
  compactInfoLabel: {
    color: colors.textSecondary,
    fontWeight: "700",
  },
  locationEditor: {
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  locationEditorHeading: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  locationEditorHeadingText: {
    flex: 1,
    gap: spacing.xs,
  },
  locationEditorTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
  },
  locationEditorDescription: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  closeButton: {
    color: colors.textSecondary,
    fontSize: 25,
    lineHeight: 25,
  },
  locationErrorContainer: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.errorSoft,
  },
  offlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  offlineIcon: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  offlineText: {
    flexShrink: 1,
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
  },
  disabled: {
    opacity: 0.5,
  },
});
