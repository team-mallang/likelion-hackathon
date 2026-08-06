import { useContext } from "react";

import { CaseDraftContext } from "@/features/case/context/CaseDraftContext";

export function useCaseDraft() {
  const context = useContext(CaseDraftContext);

  if (!context) {
    throw new Error(
      "useCaseDraft는 CaseDraftProvider 안에서 사용해야 합니다.",
    );
  }

  return context;
}