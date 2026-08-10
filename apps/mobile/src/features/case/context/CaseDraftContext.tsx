import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  CaseAnalysisAnswer,
  CaseAnalysisResult,
} from "@project/shared";

import {
  initialCaseDraft,
  type CaseDraft,
} from "@/features/case/types/caseDraft";
import { applyCaseAnswer } from "@/features/case/utils/applyCaseAnswer";

type CaseDraftContextValue = {
  draft: CaseDraft;
  resetDraft: () => void;
  updateDraft: (changes: Partial<CaseDraft>) => void;
  resetStatementAnalysis: () => void;
  applyAnalysis: (analysis: CaseAnalysisResult) => void;
  upsertAnswer: (answer: CaseAnalysisAnswer) => void;
};

export const CaseDraftContext =
  createContext<CaseDraftContextValue | null>(null);

type CaseDraftProviderProps = {
  children: ReactNode;
};

export function CaseDraftProvider({
  children,
}: CaseDraftProviderProps) {
  const [draft, setDraft] = useState<CaseDraft>(initialCaseDraft);

  const resetDraft = useCallback(() => {
    setDraft(initialCaseDraft);
  }, []);

  const updateDraft = useCallback((changes: Partial<CaseDraft>) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...changes,
    }));
  }, []);

  const resetStatementAnalysis = useCallback(() => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      type: "UNKNOWN",
      aiSummary: null,
      missingFields: [],
      questions: [],
      answers: [],
      items: [],
      emergencyItemIncluded: false,
      riskLevel: "LOW",
      errorMessage: null,
    }));
  }, []);

  const applyAnalysis = useCallback((analysis: CaseAnalysisResult) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      aiSummary: analysis.summary,
      missingFields: analysis.missingFields,
      questions: analysis.questions,
      items: analysis.items,
      errorMessage: null,
    }));
  }, []);

  const upsertAnswer = useCallback((answer: CaseAnalysisAnswer) => {
    setDraft((currentDraft) => applyCaseAnswer(currentDraft, answer));
  }, []);

  const value = useMemo(
    () => ({
      draft,
      resetDraft,
      updateDraft,
      resetStatementAnalysis,
      applyAnalysis,
      upsertAnswer,
    }),
    [
      applyAnalysis,
      draft,
      resetDraft,
      resetStatementAnalysis,
      updateDraft,
      upsertAnswer,
    ],
  );

  return (
    <CaseDraftContext.Provider value={value}>
      {children}
    </CaseDraftContext.Provider>
  );
}
