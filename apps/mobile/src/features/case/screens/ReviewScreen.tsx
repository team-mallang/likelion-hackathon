import { useRouter, type Href } from "expo-router";
import { useRef, useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { ReviewView } from "@/features/case/views/ReviewView";
import { analyzeCase, CaseApiError } from "@/features/case/services/apiCaseFlow";

export function ReviewScreen() {
  const router = useRouter();
  const { draft, updateDraft, resetStatementAnalysis, applyAnalysis } = useCaseDraft();
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const analysisInFlightRef = useRef(false);

  function handleStatementChange(value: string) {
    updateDraft({ initialStatement: value, errorMessage: null });
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

  async function handleAnalyze() {
    if (analysisInFlightRef.current) {
      return;
    }

    if (!draft.initialStatement.trim()) {
      updateDraft({ errorMessage: "분석할 사건 내용을 입력해 주세요." });
      return;
    }

    analysisInFlightRef.current = true;
    setIsAnalyzing(true);
    updateDraft({ errorMessage: null });
    try {
      const response = await analyzeCase({
        initialStatement: draft.initialStatement,
        countryCode: draft.countryCode,
        type: draft.type,
        lastSeenAt: draft.lastSeenAt,
        lastSeenPlace: draft.lastSeenPlace,
        discoveredAt: draft.discoveredAt,
        discoveredPlace: draft.discoveredPlace,
        estimatedOccurredAt: draft.estimatedOccurredAt,
        estimatedOccurredPlace: draft.estimatedOccurredPlace,
        routeAfterLastSeen: draft.routeAfterLastSeen,
        storageState: draft.storageState,
        description: draft.description,
        items: draft.items,
        answers: draft.answers,
      });
      // Apply the API result before navigating so S04 always receives the
      // canonical, latest CaseDraft. Provider failures already contain a
      // deterministic fallback result, so the intake flow can keep moving.
      updateDraft({ errorMessage: null });
      applyAnalysis(response.data);
      router.push("/case/questions" as Href);
    } catch (error) {
      updateDraft({
        errorMessage:
          error instanceof CaseApiError
            ? error.message
            : "사건 내용을 분석하지 못했습니다. 다시 시도해 주세요.",
      });
    } finally {
      analysisInFlightRef.current = false;
      setIsAnalyzing(false);
    }
  }

  return (
    <ReviewView
      statement={draft.initialStatement}
      isEditingStatement={isEditingStatement}
      isAnalyzing={isAnalyzing}
      errorMessage={draft.errorMessage}
      canAnalyze={draft.initialStatement.trim().length > 0}
      onAnalyze={() => void handleAnalyze()}
      onBack={() => router.back()}
      onRecordAgain={handleRecordAgain}
      onStatementChange={handleStatementChange}
      onStatementEditToggle={() =>
        setIsEditingStatement((current) => !current)
      }
    />
  );
}
