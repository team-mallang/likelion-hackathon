import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { InterpreterConnectionState } from "@/features/police-support/services/interpreterEngine";
import type { SpeakerRole } from "@/features/police-support/types/policeSupport";
import type {
  PoliceReportActionStatus,
  PoliceSupportMicrophoneStatus,
} from "@/features/police-support/views/PoliceSupportView.types";
import { colors, radius, spacing } from "@/theme/tokens";

type PoliceSupportControlsProps = {
  activeSpeakerRole: SpeakerRole;
  sessionStatus: InterpreterConnectionState;
  microphoneStatus: PoliceSupportMicrophoneStatus;
  permissionErrorMessage: string | null;
  connectionErrorMessage: string | null;
  reportDraftStatus: PoliceReportActionStatus;
  reportDraftErrorMessage: string | null;
  onSelectSpeaker: (role: SpeakerRole) => void;
  onPressMicrophone: () => void;
  onOpenPermissionSettings: () => void;
  onRetryConnection: () => void;
  onCreateOrOpenReport: () => void;
};

export function PoliceSupportControls({
  activeSpeakerRole,
  sessionStatus,
  microphoneStatus,
  permissionErrorMessage,
  connectionErrorMessage,
  reportDraftStatus,
  reportDraftErrorMessage,
  onSelectSpeaker,
  onPressMicrophone,
  onOpenPermissionSettings,
  onRetryConnection,
  onCreateOrOpenReport,
}: PoliceSupportControlsProps) {
  const reportLoading = reportDraftStatus === "GENERATING";
  const roleSelectionDisabled =
    microphoneStatus === "LISTENING" || microphoneStatus === "PROCESSING";
  const microphoneDisabled =
    reportLoading ||
    microphoneStatus === "REQUESTING_PERMISSION" ||
    microphoneStatus === "PROCESSING" ||
    sessionStatus === "CONNECTING" ||
    sessionStatus === "RECONNECTING";
  const isListening = microphoneStatus === "LISTENING";

  const reportLabel =
    reportDraftStatus === "READY"
      ? "신고서 초안 보기"
      : reportDraftStatus === "FAILED"
        ? "신고서 초안 다시 만들기"
        : "신고서 초안 생성";

  return (
    <View style={styles.dock}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: reportLoading, busy: reportLoading }}
        disabled={reportLoading}
        onPress={onCreateOrOpenReport}
        style={({ pressed }) => [
          styles.reportButton,
          pressed && !reportLoading && styles.pressed,
          reportLoading && styles.disabled,
        ]}
      >
        {reportLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Ionicons
            accessibilityElementsHidden
            color={colors.primary}
            name="document-text-outline"
            size={20}
          />
        )}
        <Text style={styles.reportButtonText}>
          {reportLoading ? "신고서 초안 만드는 중" : reportLabel}
        </Text>
      </Pressable>

      {reportDraftErrorMessage ? (
        <Text accessibilityRole="alert" style={styles.errorText}>
          {reportDraftErrorMessage}
        </Text>
      ) : null}

      {permissionErrorMessage ? (
        <InlineControlError
          actionLabel="설정 열기"
          message={permissionErrorMessage}
          onAction={onOpenPermissionSettings}
        />
      ) : null}

      {connectionErrorMessage ? (
        <InlineControlError
          actionLabel="다시 연결"
          message={connectionErrorMessage}
          onAction={onRetryConnection}
        />
      ) : null}

      <View style={styles.interpreterControls}>
        <SpeakerButton
          active={activeSpeakerRole === "TRAVELER"}
          disabled={roleSelectionDisabled}
          language="한국어"
          onPress={() => onSelectSpeaker("TRAVELER")}
          role="여행자"
        />

        <Pressable
          accessibilityLabel={isListening ? "통역 녹음 중지" : "통역 녹음 시작"}
          accessibilityRole="button"
          accessibilityState={{
            disabled: microphoneDisabled,
            busy:
              microphoneStatus === "REQUESTING_PERMISSION" ||
              microphoneStatus === "PROCESSING",
          }}
          disabled={microphoneDisabled}
          onPress={onPressMicrophone}
          style={({ pressed }) => [
            styles.microphoneButton,
            isListening && styles.microphoneListening,
            pressed && !microphoneDisabled && styles.pressed,
            microphoneDisabled && styles.disabled,
          ]}
        >
          {microphoneStatus === "REQUESTING_PERMISSION" ||
          microphoneStatus === "PROCESSING" ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Ionicons
              accessibilityElementsHidden
              color={colors.background}
              name={isListening ? "stop" : "mic-outline"}
              size={30}
            />
          )}
        </Pressable>

        <SpeakerButton
          active={activeSpeakerRole === "POLICE_OFFICER"}
          disabled={roleSelectionDisabled}
          language="日本語"
          onPress={() => onSelectSpeaker("POLICE_OFFICER")}
          role="경찰관"
        />
      </View>

      <Text accessibilityLiveRegion="polite" style={styles.statusText}>
        {controlStatusLabel(sessionStatus, microphoneStatus, activeSpeakerRole)}
      </Text>
    </View>
  );
}

type SpeakerButtonProps = {
  active: boolean;
  disabled: boolean;
  language: string;
  role: string;
  onPress: () => void;
};

function SpeakerButton({
  active,
  disabled,
  language,
  role,
  onPress,
}: SpeakerButtonProps) {
  return (
    <Pressable
      accessibilityLabel={`${role}, ${language}로 말하기`}
      accessibilityRole="radio"
      accessibilityState={{ checked: active, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.speakerButton,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[styles.languageText, active && styles.languageTextActive]}
      >
        {language}
      </Text>
      <Text style={styles.roleText}>{role}</Text>
    </Pressable>
  );
}

type InlineControlErrorProps = {
  message: string;
  actionLabel: string;
  onAction: () => void;
};

function InlineControlError({
  message,
  actionLabel,
  onAction,
}: InlineControlErrorProps) {
  return (
    <View accessibilityRole="alert" style={styles.inlineError}>
      <Text style={styles.inlineErrorText}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        style={styles.inlineErrorAction}
      >
        <Text style={styles.inlineErrorActionText}>{actionLabel}</Text>
      </Pressable>
    </View>
  );
}

function controlStatusLabel(
  sessionStatus: InterpreterConnectionState,
  microphoneStatus: PoliceSupportMicrophoneStatus,
  activeSpeakerRole: SpeakerRole,
) {
  if (sessionStatus === "CONNECTING" || sessionStatus === "RECONNECTING") {
    return "실시간 통역에 연결하고 있습니다.";
  }

  if (microphoneStatus === "REQUESTING_PERMISSION") {
    return "마이크 권한을 확인하고 있습니다.";
  }

  if (microphoneStatus === "LISTENING") {
    return activeSpeakerRole === "TRAVELER"
      ? "한국어 · 여행자 말하는 중"
      : "日本語 · 경찰관 말하는 중";
  }

  if (microphoneStatus === "PROCESSING") {
    return "발화를 문자와 번역문으로 정리하고 있습니다.";
  }

  if (microphoneStatus === "INTERRUPTED") {
    return "통역이 일시 중지되었습니다.";
  }

  return activeSpeakerRole === "TRAVELER"
    ? "한국어로 말할 여행자가 선택되었습니다."
    : "日本語로 말할 경찰관이 선택되었습니다.";
}

const styles = StyleSheet.create({
  dock: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  reportButton: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    cursor: "pointer",
  },
  reportButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "800",
  },
  interpreterControls: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: spacing.sm,
  },
  speakerButton: {
    minWidth: 88,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    cursor: "pointer",
  },
  languageText: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "800",
  },
  languageTextActive: {
    backgroundColor: colors.primarySoft,
    color: colors.primary,
  },
  roleText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  microphoneButton: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 36,
    backgroundColor: colors.primary,
    cursor: "pointer",
  },
  microphoneListening: {
    backgroundColor: colors.primaryPressed,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: "center",
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  inlineErrorText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
  },
  inlineErrorAction: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
    cursor: "pointer",
  },
  inlineErrorActionText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  pressed: {
    opacity: 0.78,
  },
  disabled: {
    opacity: 0.45,
  },
});
