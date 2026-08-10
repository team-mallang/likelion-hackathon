import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ActiveCase = {
  caseId: string;
  caseNumber: string;
};

type ActiveCaseContextValue = {
  activeCase: ActiveCase | null;
  setActiveCase: (activeCase: ActiveCase) => void;
  clearActiveCase: () => void;
};

export const ActiveCaseContext =
  createContext<ActiveCaseContextValue | null>(null);

type ActiveCaseProviderProps = {
  children: ReactNode;
};

export function ActiveCaseProvider({
  children,
}: ActiveCaseProviderProps) {
  const [activeCase, setActiveCaseState] = useState<ActiveCase | null>(null);

  const setActiveCase = useCallback((nextActiveCase: ActiveCase) => {
    setActiveCaseState(nextActiveCase);
  }, []);

  const clearActiveCase = useCallback(() => {
    setActiveCaseState(null);
  }, []);

  const value = useMemo(
    () => ({ activeCase, setActiveCase, clearActiveCase }),
    [activeCase, clearActiveCase, setActiveCase],
  );

  return (
    <ActiveCaseContext.Provider value={value}>
      {children}
    </ActiveCaseContext.Provider>
  );
}
