import { useRouter, type Href } from "expo-router";
import { useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { ReviewView } from "@/features/case/views/ReviewView";

function getExpectedCaseTypeLabel(
  caseType: "LOST" | "STOLEN" | "UNKNOWN",
) {
  if (caseType === "LOST") {
    return "분실 신고";
  }

  if (caseType === "STOLEN") {
    return "도난 신고";
  }

  return "분석 전";
}

export function ReviewScreen() {
  const router = useRouter();
  const { draft, updateDraft, resetStatementAnalysis } = useCaseDraft();
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);

  function handleStatementChange(value: string) {
    updateDraft({ initialStatement: value, errorMessage: null });
    resetStatementAnalysis();
  }

  function handleLocationChange(value: string) {
    updateDraft({
      lastSeenPlace: value || null,
      coordinates: null,
      errorMessage: null,
    });
    resetStatementAnalysis();
  }

  function handleOccurredAtChange(value: string) {
    updateDraft({ lastSeenAt: value || null, errorMessage: null });
    resetStatementAnalysis();
  }

  function handleRecordAgain() {
    updateDraft({
      initialStatement: "",
      inputMode: "voice",
      errorMessage: null,
    });
    resetStatementAnalysis();
    router.replace("/case/new" as Href);
  }

  function handleAnalyze() {
    if (!draft.initialStatement.trim()) {
      updateDraft({ errorMessage: "분석할 사건 내용을 입력해 주세요." });
      return;
    }

    router.push("/case/questions" as Href);
  }

  return (
    <ReviewView
      statement={draft.initialStatement}
      locationText={draft.lastSeenPlace ?? ""}
      occurredAtText={draft.lastSeenAt ?? ""}
      expectedCaseTypeLabel={getExpectedCaseTypeLabel(draft.type)}
      isEditingStatement={isEditingStatement}
      isEditingLocation={isEditingLocation}
      isEditingTime={isEditingTime}
      isAnalyzing={false}
      errorMessage={draft.errorMessage}
      canAnalyze={draft.initialStatement.trim().length > 0}
      onAnalyze={handleAnalyze}
      onBack={() => router.back()}
      onLocationChange={handleLocationChange}
      onLocationEditToggle={() =>
        setIsEditingLocation((current) => !current)
      }
      onOccurredAtChange={handleOccurredAtChange}
      onRecordAgain={handleRecordAgain}
      onStatementChange={handleStatementChange}
      onStatementEditToggle={() =>
        setIsEditingStatement((current) => !current)
      }
      onTimeEditToggle={() =>
        setIsEditingTime((current) => !current)
      }
    />
  );
}
