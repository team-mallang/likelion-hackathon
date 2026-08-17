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
  const [answerValues, setAnswerValues] = useState<Record<string, CaseAnalysisAnswer["value"]>>({});
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
      if (response.meta.provider !== "openai" || response.meta.fallback) throw new CaseApiError("AI_ANALYSIS_FAILED", "분석 서비스 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.");
      applyAnalysis(response.data);
      if (response.data.questions.length === 0) router.push("/case/confirmation" as Href);
    } catch (error) {
      updateDraft({ errorMessage: error instanceof CaseApiError ? error.message : "사건 내용을 분석하지 못했습니다. 다시 시도해 주세요." });
    } finally { analysisInFlightRef.current = false; setIsAnalyzing(false); }
  }

  useEffect(() => {
    if (requestedInitialAnalysis.current || draft.aiSummary !== null || isAnalyzing) return;
    requestedInitialAnalysis.current = true; void runAnalysis(draft.answers);
  }, [draft.aiSummary, draft.answers, isAnalyzing]);

  function changeAnswer(field: string, value: CaseAnalysisAnswer["value"]) {
    setAnswerValues((current) => ({ ...current, [field]: value }));
  }

  async function submit() {
    if (!currentQuestion) { if (draft.aiSummary === null) await runAnalysis(draft.answers); else router.push("/case/confirmation" as Href); return; }
    const pending = questions.map((question) => ({
      question,
      value: answerValues[question.field] ?? "",
    }));
    if (pending.some(({ question, value }) => question.required && !hasAnswer(value))) {
      setValidationError("필수 질문에 답변해 주세요.");
      return;
    }
    const answers = pending.map(({ question, value }) => ({
      field: question.field,
      value: question.answerType === "number" && typeof value === "string" ? Number(value) : value,
    })) satisfies CaseAnalysisAnswer[];
    const nextAnswers = [...draft.answers.filter((answer) => !answers.some((next) => next.field === answer.field)), ...answers];
    const answeredDraft = answers.reduce(applyCaseAnswer, draft);
    answers.forEach(upsertAnswer);
    await runAnalysis(nextAnswers, answeredDraft);
  }

  return <QuestionsView questions={questions} answers={answerValues} progress={currentQuestion ? 0.75 : 1} isSaving={isAnalyzing} errorMessage={validationError ?? draft.errorMessage} onAnswerChange={changeAnswer} onBack={() => router.back()} onSubmit={() => void submit()} />;
}
