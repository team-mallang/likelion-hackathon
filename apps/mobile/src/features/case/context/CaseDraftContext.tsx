import {
  useCallback,
  createContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  initialCaseDraft,
  type CaseDraft,
  type CaseDraftItem,
} from "@/features/case/types/caseDraft";

type AnalysisResult = Pick<CaseDraft, "caseType" | "questions">;

type CaseSummary = Pick<
  CaseDraft,
  | "caseType"
  | "items"
  | "emergencyItemIncluded"
  | "riskLevel"
  | "details"
  | "clues"
>;

type CaseDraftContextValue = {
  draft: CaseDraft;
  resetDraft: () => void;
  updateDraft: (changes: Partial<CaseDraft>) => void;
  answerQuestion: (field: string, answer: string) => void;
  applyAnalysisResult: (result: AnalysisResult) => void;
  resetStatementAnalysis: () => void;
  applyCaseSummary: (summary: CaseSummary) => void;
  addItem: (item: CaseDraftItem) => void;
  updateItem: (
    id: string,
    changes: Partial<CaseDraftItem>,
  ) => void;
  removeItem: (id: string) => void;
  startSaving: () => void;
  completeSaving: () => void;
  failSaving: (message: string) => void;
  clearSaveState: () => void;
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

  const answerQuestion = useCallback((field: string, answer: string) => {
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
  }, []);

  const applyAnalysisResult = useCallback((result: AnalysisResult) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      caseType: result.caseType,
      questions: result.questions.map((question) => ({ ...question })),
      items: [],
      emergencyItemIncluded: false,
      riskLevel: "LOW",
      details: "",
      clues: "",
    }));
  }, []);

  const resetStatementAnalysis = useCallback(() => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      questions: [],
      caseType: "UNKNOWN",
      items: [],
      emergencyItemIncluded: false,
      riskLevel: "LOW",
      details: "",
      clues: "",
      isSaving: false,
      errorMessage: null,
    }));
  }, []);

  const applyCaseSummary = useCallback((summary: CaseSummary) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      caseType: summary.caseType,
      items: summary.items.map((item) => ({ ...item })),
      emergencyItemIncluded: summary.emergencyItemIncluded,
      riskLevel: summary.riskLevel,
      details: summary.details,
      clues: summary.clues,
    }));
  }, []);

  const addItem = useCallback((item: CaseDraftItem) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      items: [...currentDraft.items, { ...item }],
    }));
  }, []);

  const updateItem = useCallback(
    (id: string, changes: Partial<CaseDraftItem>) => {
      setDraft((currentDraft) => ({
        ...currentDraft,
        items: currentDraft.items.map((item) =>
          item.id === id
            ? {
                ...item,
                ...changes,
                id: item.id,
              }
            : item,
        ),
      }));
    },
    [],
  );

  const removeItem = useCallback((id: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      items: currentDraft.items.filter((item) => item.id !== id),
    }));
  }, []);

  const startSaving = useCallback(() => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      isSaving: true,
      errorMessage: null,
    }));
  }, []);

  const completeSaving = useCallback(() => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      isSaving: false,
      errorMessage: null,
    }));
  }, []);

  const failSaving = useCallback((message: string) => {
    setDraft((currentDraft) => ({
      ...currentDraft,
      isSaving: false,
      errorMessage: message,
    }));
  }, []);

  const clearSaveState = useCallback(() => {
    setDraft((currentDraft) => {
      if (!currentDraft.isSaving && currentDraft.errorMessage === null) {
        return currentDraft;
      }

      return {
        ...currentDraft,
        isSaving: false,
        errorMessage: null,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      draft,
      resetDraft,
      updateDraft,
      answerQuestion,
      applyAnalysisResult,
      resetStatementAnalysis,
      applyCaseSummary,
      addItem,
      updateItem,
      removeItem,
      startSaving,
      completeSaving,
      failSaving,
      clearSaveState,
    }),
    [
      addItem,
      answerQuestion,
      applyAnalysisResult,
      applyCaseSummary,
      clearSaveState,
      completeSaving,
      draft,
      failSaving,
      removeItem,
      resetDraft,
      resetStatementAnalysis,
      startSaving,
      updateDraft,
      updateItem,
    ],
  );

  return (
    <CaseDraftContext.Provider value={value}>
      {children}
    </CaseDraftContext.Provider>
  );
}
