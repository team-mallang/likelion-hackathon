import { useRouter, type Href } from "expo-router";
import { useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { VoiceInputView } from "@/features/case/views/VoiceInputView";
import type { RecordingState } from "@/features/case/views/VoiceInputView.types";
import {
  AudioRecorderError,
  useExpoAudioRecorder,
} from "@/services/device/audioRecorder";

type VoiceInputError = {
  kind: "permissionDenied" | "recording";
  message: string;
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
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] =
    useState(0);
  const [voiceInputError, setVoiceInputError] =
    useState<VoiceInputError | null>(null);

  const recordingTimeLabel = formatRecordingTime(
    recordingElapsedSeconds,
  );

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
    setRecordingElapsedSeconds(0);
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

  function handleBack() {
    router.back();
  }

  function handleContinue() {
    if (!draft.statement.trim()) {
      return;
    }

    router.push("/case/review" as Href);
  }

  function handleInputModeChange(mode: "voice" | "text") {
    setVoiceInputError(null);

    if (mode === "text") {
      setRecordingState("idle");
      setRecordingElapsedSeconds(0);
    }

    updateDraft({ inputMode: mode });
  }

  function handleRecordAgain() {
    setVoiceInputError(null);
    setRecordingState("idle");
    setRecordingElapsedSeconds(0);
    handleRecordStart();
  }

  function handleRecordStop() {
    // 실제 녹음 기능 구현 단계에서 연결한다.
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
      canContinue={draft.statement.trim().length > 0}
      onBack={handleBack}
      onContinue={handleContinue}
      onInputModeChange={handleInputModeChange}
      onRecordAgain={handleRecordAgain}
      onRecordStart={handleRecordStart}
      onRecordStop={handleRecordStop}
      onStatementChange={handleStatementChange}
    />
  );
}
