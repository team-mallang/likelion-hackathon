import { useRouter, type Href } from "expo-router";
import { useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { VoiceInputView } from "@/features/case/views/VoiceInputView";
import type { RecordingState } from "@/features/case/views/VoiceInputView.types";

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
  const [recordingState, setRecordingState] =
    useState<RecordingState>("idle");
  const [recordingElapsedSeconds, setRecordingElapsedSeconds] =
    useState(0);
  const [voiceInputError, setVoiceInputError] =
    useState<VoiceInputError | null>(null);

  const recordingTimeLabel = formatRecordingTime(
    recordingElapsedSeconds,
  );

  function handleRecordStart() {
    setVoiceInputError(null);
    setRecordingElapsedSeconds(0);
    setRecordingState("processing");

    updateDraft({
      statement: "신주쿠역에서 지갑을 잃어버렸어요.",
      locationText: "일본 도쿄 신주쿠역 주변",
      occurredAtText: "14:30",
    });

    setRecordingState("idle");
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
