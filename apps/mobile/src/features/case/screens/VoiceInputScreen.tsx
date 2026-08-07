import { useRouter, type Href } from "expo-router";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { VoiceInputView } from "@/features/case/views/VoiceInputView";
import type { RecordingState } from "@/features/case/views/VoiceInputView.types";

export function VoiceInputScreen() {
  const router = useRouter();
  const { draft, updateDraft } = useCaseDraft();
  const recordingState: RecordingState = "idle";
  const recordingTimeLabel = "00:00";

  function handleRecordStart() {
    updateDraft({
      statement: "신주쿠역에서 지갑을 잃어버렸어요.",
      locationText: "일본 도쿄 신주쿠역 주변",
      occurredAtText: "14:30",
    });
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
    updateDraft({ inputMode: mode });
  }

  function handleRecordAgain() {
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
      errorMessage={draft.errorMessage}
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
