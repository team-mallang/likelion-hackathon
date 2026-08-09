import { useRouter, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { CaseFlowError } from "@/features/case/services/caseFlow";
import { mockCaseFlow } from "@/features/case/services/mockCaseFlow";
import { QuestionsView } from "@/features/case/views/QuestionsView";

export function QuestionsScreen() {
  const router = useRouter();
  const { draft, answerQuestion, applyCaseSummary } = useCaseDraft();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [inputErrorMessage, setInputErrorMessage] = useState<
    string | null
  >(null);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(
    null,
  );
  const summaryRequestIdRef = useRef(0);
  const summaryInFlightRef = useRef(false);

  const totalCount = draft.questions.length;
  const safeCurrentIndex =
    totalCount === 0 ? 0 : Math.min(currentIndex, totalCount - 1);
  const currentQuestion = draft.questions[safeCurrentIndex] ?? null;

  useEffect(() => {
    if (currentIndex !== safeCurrentIndex) {
      setCurrentIndex(safeCurrentIndex);
    }
  }, [currentIndex, safeCurrentIndex]);

  useEffect(() => {
    return () => {
      summaryRequestIdRef.current += 1;
      summaryInFlightRef.current = false;
    };
  }, []);

  function invalidatePendingSummary() {
    if (!summaryInFlightRef.current) {
      return;
    }

    summaryRequestIdRef.current += 1;
    summaryInFlightRef.current = false;
    setIsSaving(false);
  }

  function handleBack() {
    invalidatePendingSummary();

    if (totalCount === 0) {
      router.replace("/case/review" as Href);
      return;
    }

    router.back();
  }

  function handleAnswerChange(value: string) {
    if (!currentQuestion || isSaving) {
      return;
    }

    answerQuestion(currentQuestion.field, value);
    setInputErrorMessage(null);
    setSaveErrorMessage(null);
  }

  function validateCurrentAnswer() {
    if (!currentQuestion?.answer.trim()) {
      setInputErrorMessage("답변을 입력해야 다음 단계로 이동할 수 있습니다.");
      return false;
    }

    setInputErrorMessage(null);
    return true;
  }

  function handlePrevious() {
    if (isSaving || safeCurrentIndex === 0) {
      return;
    }

    setInputErrorMessage(null);
    setSaveErrorMessage(null);
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  function handleNext() {
    if (
      isSaving ||
      !currentQuestion ||
      !validateCurrentAnswer() ||
      safeCurrentIndex >= totalCount - 1
    ) {
      return;
    }

    setSaveErrorMessage(null);
    setCurrentIndex((index) => Math.min(totalCount - 1, index + 1));
  }

  async function handleComplete() {
    if (
      isSaving ||
      summaryInFlightRef.current ||
      !currentQuestion ||
      !validateCurrentAnswer()
    ) {
      return;
    }

    const firstUnansweredIndex = draft.questions.findIndex(
      (question) => !question.answer.trim(),
    );

    if (firstUnansweredIndex >= 0) {
      setCurrentIndex(firstUnansweredIndex);
      setInputErrorMessage("모든 질문에 답변해 주세요.");
      return;
    }

    summaryInFlightRef.current = true;
    const requestId = ++summaryRequestIdRef.current;
    setIsSaving(true);
    setSaveErrorMessage(null);

    try {
      const result = await mockCaseFlow.buildCaseSummary({ draft });

      if (requestId !== summaryRequestIdRef.current) {
        return;
      }

      applyCaseSummary(result);
      router.push("/case/confirmation" as Href);
    } catch (error) {
      if (requestId !== summaryRequestIdRef.current) {
        return;
      }

      setSaveErrorMessage(
        error instanceof CaseFlowError
          ? error.message
          : "답변을 분석하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      if (requestId === summaryRequestIdRef.current) {
        summaryInFlightRef.current = false;
        setIsSaving(false);
      }
    }
  }

  return (
    <QuestionsView
      currentQuestion={currentQuestion?.question ?? null}
      currentAnswer={currentQuestion?.answer ?? ""}
      currentIndex={safeCurrentIndex}
      totalCount={totalCount}
      progress={totalCount === 0 ? 0 : (safeCurrentIndex + 1) / totalCount}
      isFirstQuestion={safeCurrentIndex === 0}
      isLastQuestion={
        totalCount > 0 && safeCurrentIndex === totalCount - 1
      }
      isSaving={isSaving}
      errorMessage={
        totalCount === 0
          ? "분석된 추가 질문을 찾을 수 없습니다."
          : inputErrorMessage ?? saveErrorMessage
      }
      onAnswerChange={handleAnswerChange}
      onBack={handleBack}
      onComplete={handleComplete}
      onNext={handleNext}
      onPrevious={handlePrevious}
    />
  );
}
