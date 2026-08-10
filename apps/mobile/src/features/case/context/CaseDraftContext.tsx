import {
  createContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  initialCaseDraft,
  type CaseDraft,
} from "@/features/case/types/caseDraft";
import type {
  CaseAnalysisAnswer,
  CaseAnalysisResult,
} from "@project/shared";
import { applyCaseAnswer } from "@/features/case/utils/applyCaseAnswer";

type CaseDraftContextValue = {
  draft: CaseDraft;
  resetDraft: () => void;
  updateDraft: (changes: Partial<CaseDraft>) => void;
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

  function resetDraft() {
    setDraft(initialCaseDraft);
  }

  function updateDraft(changes: Partial<CaseDraft>) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      ...changes,
    }));
  }

  function applyAnalysis(analysis: CaseAnalysisResult) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      aiSummary: analysis.summary,
      missingFields: analysis.missingFields,
      questions: analysis.questions,
      items: analysis.items,
      errorMessage: null,
    }));
  }

  function upsertAnswer(answer: CaseAnalysisAnswer) {
    setDraft((currentDraft) => applyCaseAnswer(currentDraft, answer));
  }

  const value = useMemo(
    () => ({
      draft,
      resetDraft,
      updateDraft,
      applyAnalysis,
      upsertAnswer,
    }),
    [draft],
  );

  return (
    <CaseDraftContext.Provider value={value}>
      {children}
    </CaseDraftContext.Provider>
  );
}
