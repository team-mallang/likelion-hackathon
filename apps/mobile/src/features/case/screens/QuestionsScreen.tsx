import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import type { CaseAnalysisAnswer } from "@project/shared";

import { useCaseDraft } from "@/features/case/hooks/useCaseDraft";
import { analyzeCase, CaseApiError } from "@/features/case/services/apiCaseFlow";
import type { CaseDraft } from "@/features/case/types/caseDraft";
import { applyCaseAnswer } from "@/features/case/utils/applyCaseAnswer";
import { QuestionsView } from "@/features/case/views/QuestionsView";

function hasAnswer(value: CaseAnalysisAnswer["value"]) {
  return Array.isArray(value) ? value.length > 0 : typeof value === "string" ? value.trim().length > 0 : true;
}

export function QuestionsScreen() {
  const router = useRouter();
  const { draft, updateDraft, applyAnalysis, upsertAnswer } = useCaseDraft();
  const [answerValue, setAnswerValue] = useState<CaseAnalysisAnswer["value"]>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const requestedInitialAnalysis = useRef(false);
  const analysisInFlightRef = useRef(false);
  const questions = useMemo(() => [...draft.questions].sort((a, b) => a.order - b.order), [draft.questions]);
  const currentQuestion = questions[0];

  async function runAnalysis(answers: CaseAnalysisAnswer[], sourceDraft: CaseDraft = draft) {
    if (analysisInFlightRef.current) return;
    analysisInFlightRef.current = true;
    setIsAnalyzing(true); setValidationError(null); updateDraft({ errorMessage: null });
    try {
      const response = await analyzeCase({ initialStatement: sourceDraft.initialStatement, countryCode: sourceDraft.countryCode, type: sourceDraft.type, lastSeenAt: sourceDraft.lastSeenAt, lastSeenPlace: sourceDraft.lastSeenPlace, discoveredAt: sourceDraft.discoveredAt, discoveredPlace: sourceDraft.discoveredPlace, estimatedOccurredAt: sourceDraft.estimatedOccurredAt, estimatedOccurredPlace: sourceDraft.estimatedOccurredPlace, routeAfterLastSeen: sourceDraft.routeAfterLastSeen, storageState: sourceDraft.storageState, description: sourceDraft.description, items: sourceDraft.items, answers });
      if (response.meta.provider !== "openai" || response.meta.fallback) throw new CaseApiError("AI_ANALYSIS_FAILED", "OpenAI analysis was unavailable. Please try again.");
      applyAnalysis(response.data); setAnswerValue("");
      if (response.data.questions.length === 0) router.push("/case/confirmation" as Href);
    } catch (error) {
      updateDraft({ errorMessage: error instanceof CaseApiError ? error.message : "Unable to analyze this case. Please try again." });
    } finally { analysisInFlightRef.current = false; setIsAnalyzing(false); }
  }

  useEffect(() => {
    if (requestedInitialAnalysis.current || draft.aiSummary !== null || isAnalyzing) return;
    requestedInitialAnalysis.current = true; void runAnalysis(draft.answers);
  }, [draft.aiSummary, draft.answers, isAnalyzing]);

  async function submit() {
    if (!currentQuestion) { if (draft.aiSummary === null) await runAnalysis(draft.answers); else router.push("/case/confirmation" as Href); return; }
    if (currentQuestion.required && !hasAnswer(answerValue)) { setValidationError("필수 질문에 답변해 주세요."); return; }
    const value = currentQuestion.answerType === "number" && typeof answerValue === "string" ? Number(answerValue) : answerValue;
    const answer = { field: currentQuestion.field, value } satisfies CaseAnalysisAnswer;
    const nextAnswers = [...draft.answers.filter((item) => item.field !== answer.field), answer];
    // Analyze the already-applied value, not the stale render's draft.
    const answeredDraft = applyCaseAnswer(draft, answer);
    upsertAnswer(answer);
    await runAnalysis(nextAnswers, answeredDraft);
  }

  return <QuestionsView currentQuestion={currentQuestion ?? null} currentAnswer={answerValue} currentIndex={currentQuestion?.order ?? 0} totalCount={Math.max(questions.length, 1)} progress={currentQuestion ? 0.75 : 1} isSaving={isAnalyzing} errorMessage={validationError ?? draft.errorMessage} onAnswerChange={setAnswerValue} onBack={() => router.back()} onSubmit={() => void submit()} />;
}
