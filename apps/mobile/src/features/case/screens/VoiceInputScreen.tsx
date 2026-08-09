import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AppState, Linking } from "react-native";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { CaseFlowError } from "@/features/case/services/caseFlow";
import { mockCaseFlow } from "@/features/case/services/mockCaseFlow";
import { VoiceInputView } from "@/features/case/views/VoiceInputView";
import type { RecordingState } from "@/features/case/views/VoiceInputView.types";
import {
  AudioRecorderError,
  type RecordedAudio,
  useExpoAudioRecorder,
} from "@/services/device/audioRecorder";

type VoiceInputError = {
  kind: "permissionDenied" | "recording" | "transcription";
  message: string;
  canOpenSettings?: boolean;
};

function formatRecordingTime(elapsedSeconds: number) {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function VoiceInputScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useCaseDraft();
  const audioRecorder = useExpoAudioRecorder();
  const recordedAudioRef = useRef<RecordedAudio | null>(null);
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [voiceInputError, setVoiceInputError] =
    useState<VoiceInputError | null>(null);
  const recordingStateRef = useRef(recordingState);

  recordingStateRef.current = recordingState;

  const recordingTimeLabel = formatRecordingTime(
    Math.floor(audioRecorder.status.durationMs / 1000),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "active") {
          return;
        }

        const wasRecording =
          recordingStateRef.current === "recording";

        if (!wasRecording) {
          return;
        }

        void audioRecorder.cancel().then(
          () => {
            if (wasRecording) {
              setRecordingState("error");
              setVoiceInputError({
                kind: "recording",
                message:
                  "앱이 백그라운드로 이동하여 녹음을 종료했습니다. 다시 녹음해 주세요.",
              });
            }
          },
          () => {
            if (wasRecording) {
              setRecordingState("error");
              setVoiceInputError({
                kind: "recording",
                message:
                  "백그라운드 전환 중 녹음을 정리하지 못했습니다. 다시 녹음해 주세요.",
              });
            }
          },
        );
      },
    );

    return () => {
      subscription.remove();
      void audioRecorder.dispose().catch(() => {
        // The screen is already unmounting, so cleanup remains best-effort.
      });
    };
  }, [audioRecorder.cancel, audioRecorder.dispose]);

  async function handleRecordStart() {
    if (
      recordingState === "requestingPermission" ||
      recordingState === "recording" ||
      recordingState === "stopping" ||
      recordingState === "processing"
    ) {
      return;
    }

    setVoiceInputError(null);
    recordedAudioRef.current = null;
    setRecordingState("requestingPermission");

    try {
      let permission = await audioRecorder.getPermissionStatus();

      if (permission.status !== "granted") {
        permission = await audioRecorder.requestPermission();
      }

      if (permission.status !== "granted") {
        setRecordingState("error");
        setVoiceInputError({
          kind: "permissionDenied",
          message: permission.canAskAgain
            ? "음성 입력을 사용하려면 마이크 권한이 필요합니다. 다시 시도하거나 텍스트로 입력해 주세요."
            : "마이크 권한이 꺼져 있습니다. 기기 설정에서 권한을 허용하거나 텍스트로 입력해 주세요.",
          canOpenSettings: !permission.canAskAgain,
        });
        return;
      }

      await audioRecorder.start();
      setRecordingState("recording");
    } catch (error) {
      if (
        error instanceof AudioRecorderError &&
        error.code === "ALREADY_RECORDING"
      ) {
        setRecordingState("recording");
        return;
      }

      const permissionDenied =
        error instanceof AudioRecorderError &&
        error.code === "PERMISSION_DENIED";

      setRecordingState("error");
      setVoiceInputError({
        kind: permissionDenied ? "permissionDenied" : "recording",
        message: permissionDenied
          ? "음성 입력을 사용하려면 마이크 권한이 필요합니다."
          : "음성 녹음을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      });
    }
  }

  async function handleBack() {
    if (recordingState === "stopping") {
      return;
    }

    if (recordingState === "recording") {
      await audioRecorder.cancel().catch(() => {
        // Navigation should not be blocked when recorder cleanup fails.
      });
      recordedAudioRef.current = null;
      setRecordingState("idle");
    }

    router.back();
  }

  function handleContinue() {
    if (!draft.statement.trim()) {
      return;
    }

    router.push("/case/review" as Href);
  }

  async function handleInputModeChange(mode: "voice" | "text") {
    if (mode === draft.inputMode) {
      return;
    }

    const shouldCancelRecording =
      mode === "text" &&
      (recordingState === "recording" ||
        audioRecorder.status.isRecording);

    if (shouldCancelRecording) {
      setRecordingState("stopping");

      try {
        await audioRecorder.cancel();
      } catch {
        setRecordingState("error");
        setVoiceInputError({
          kind: "recording",
          message:
            "녹음을 정리하지 못해 텍스트 입력으로 전환할 수 없습니다. 다시 시도해 주세요.",
        });
        return;
      }
    }

    recordedAudioRef.current = null;
    setVoiceInputError(null);
    setRecordingState("idle");
    updateDraft({
      inputMode: mode,
      errorMessage: null,
    });
  }

  function handleRecordAgain() {
    setVoiceInputError(null);
    setRecordingState("idle");
    handleRecordStart();
  }

  async function handleOpenSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setRecordingState("error");
      setVoiceInputError({
        kind: "permissionDenied",
        message:
          "기기 설정을 열지 못했습니다. 설정 앱에서 Travel Guard의 마이크 권한을 허용해 주세요.",
        canOpenSettings: true,
      });
    }
  }

  async function handleRecordStop() {
    if (recordingState !== "recording") {
      return;
    }

    setVoiceInputError(null);
    setRecordingState("stopping");

    let recordedAudio: RecordedAudio;

    try {
      recordedAudio = await audioRecorder.stop();
    } catch (error) {
      const noActiveRecording =
        error instanceof AudioRecorderError &&
        error.code === "NOT_RECORDING";

      setRecordingState("error");
      setVoiceInputError({
        kind: "recording",
        message: noActiveRecording
          ? "진행 중인 녹음을 찾지 못했습니다. 다시 녹음해 주세요."
          : "음성 녹음을 종료하지 못했습니다. 다시 시도해 주세요.",
      });
      return;
    }

    recordedAudioRef.current = recordedAudio;
    setRecordingState("processing");

    try {
      const result = await mockCaseFlow.transcribeAudio({
        uri: recordedAudio.uri,
        mimeType: recordedAudio.mimeType,
        durationMs: recordedAudio.durationMs,
      });

      updateDraft({
        statement: result.statement,
        errorMessage: null,
      });
      recordedAudioRef.current = null;
      setRecordingState("idle");
    } catch (error) {
      const message =
        error instanceof CaseFlowError
          ? error.message
          : "음성을 문장으로 변환하지 못했습니다.";

      setRecordingState("error");
      setVoiceInputError({
        kind: "transcription",
        message: `${message} 다시 녹음해 주세요.`,
      });
    }
  }

  function handleStatementChange(value: string) {
    updateDraft({ statement: value });
  }

  return (
    <VoiceInputView
      statement={draft.statement}
      inputMode={draft.inputMode}
      recordingState={recordingState}
      recordingTimeLabel={recordingTimeLabel}
      locationText={draft.locationText}
      localTimeText={draft.occurredAtText}
      errorMessage={voiceInputError?.message ?? draft.errorMessage}
      canOpenSettings={voiceInputError?.canOpenSettings ?? false}
      canContinue={draft.statement.trim().length > 0}
      onBack={handleBack}
      onContinue={handleContinue}
      onInputModeChange={handleInputModeChange}
      onOpenSettings={handleOpenSettings}
      onRecordAgain={handleRecordAgain}
      onRecordStart={handleRecordStart}
      onRecordStop={handleRecordStop}
      onStatementChange={handleStatementChange}
    />
  );
}
