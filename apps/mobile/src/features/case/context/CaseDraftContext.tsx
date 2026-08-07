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

type CaseDraftContextValue = {
  draft: CaseDraft;
  resetDraft: () => void;
  updateDraft: (changes: Partial<CaseDraft>) => void;
  answerQuestion: (field: string, answer: string) => void;
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

  function answerQuestion(field: string, answer: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      questions: currentDraft.questions.map((question) =>
        question.field === field
          ? {
              ...question,
              answer,
            }
          : question,
      ),
    }));
  }

  const value = useMemo(
    () => ({
      draft,
      resetDraft,
      updateDraft,
      answerQuestion,
    }),
    [draft],
  );

  return (
    <CaseDraftContext.Provider value={value}>
      {children}
    </CaseDraftContext.Provider>
  );
}