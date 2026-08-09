import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { CaseFlowError } from "@/features/case/services/caseFlow";
import { mockCaseFlow } from "@/features/case/services/mockCaseFlow";
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
  const { draft, updateDraft } = useCaseDraft();
  const [isEditingStatement, setIsEditingStatement] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisErrorMessage, setAnalysisErrorMessage] = useState<
    string | null
  >(null);
  const analysisRequestIdRef = useRef(0);
  const analysisInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      analysisRequestIdRef.current += 1;
      analysisInFlightRef.current = false;
    };
  }, []);

  function invalidatePendingAnalysis() {
    if (!analysisInFlightRef.current) {
      return;
    }

    analysisRequestIdRef.current += 1;
    analysisInFlightRef.current = false;
    setIsAnalyzing(false);
  }

  function handleBack() {
    invalidatePendingAnalysis();
    router.back();
  }

  function handleStatementChange(value: string) {
    invalidatePendingAnalysis();
    setAnalysisErrorMessage(null);
    updateDraft({
      statement: value,
      questions: [],
      caseType: "UNKNOWN",
      errorMessage: null,
    });
  }

  function handleLocationChange(value: string) {
    invalidatePendingAnalysis();
    setAnalysisErrorMessage(null);
    updateDraft({
      locationText: value,
      coordinates: null,
      questions: [],
      caseType: "UNKNOWN",
      errorMessage: null,
    });
  }

  function handleOccurredAtChange(value: string) {
    invalidatePendingAnalysis();
    setAnalysisErrorMessage(null);
    updateDraft({
      occurredAtText: value,
      questions: [],
      caseType: "UNKNOWN",
      errorMessage: null,
    });
  }

  function handleRecordAgain() {
    invalidatePendingAnalysis();
    updateDraft({
      statement: "",
      inputMode: "voice",
      questions: [],
      caseType: "UNKNOWN",
      items: [],
      emergencyItemIncluded: false,
      riskLevel: "LOW",
      details: "",
      clues: "",
      isSaving: false,
      errorMessage: null,
    });
    router.replace("/case/new" as Href);
  }

  async function handleAnalyze() {
    if (
      analysisInFlightRef.current ||
      isAnalyzing ||
      !draft.statement.trim()
    ) {
      if (!draft.statement.trim()) {
        setAnalysisErrorMessage("분석할 사건 내용을 입력해 주세요.");
      }
      return;
    }

    analysisInFlightRef.current = true;
    const requestId = ++analysisRequestIdRef.current;
    setIsAnalyzing(true);
    setAnalysisErrorMessage(null);

    try {
      const result = await mockCaseFlow.analyzeStatement({
        statement: draft.statement,
        locationText: draft.locationText,
        occurredAtText: draft.occurredAtText,
      });

      if (requestId !== analysisRequestIdRef.current) {
        return;
      }

      updateDraft({
        caseType: result.caseType,
        questions: result.questions,
        errorMessage: null,
      });
      router.push("/case/questions" as Href);
    } catch (error) {
      if (requestId !== analysisRequestIdRef.current) {
        return;
      }

      setAnalysisErrorMessage(
        error instanceof CaseFlowError
          ? error.message
          : "사건 내용을 분석하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      if (requestId === analysisRequestIdRef.current) {
        analysisInFlightRef.current = false;
        setIsAnalyzing(false);
      }
    }
  }

  return (
    <ReviewView
      statement={draft.statement}
      locationText={draft.locationText}
      occurredAtText={draft.occurredAtText}
      expectedCaseTypeLabel={getExpectedCaseTypeLabel(draft.caseType)}
      isEditingStatement={isEditingStatement}
      isEditingLocation={isEditingLocation}
      isEditingTime={isEditingTime}
      isAnalyzing={isAnalyzing}
      errorMessage={analysisErrorMessage}
      canAnalyze={draft.statement.trim().length > 0 && !isAnalyzing}
      onAnalyze={handleAnalyze}
      onBack={handleBack}
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
