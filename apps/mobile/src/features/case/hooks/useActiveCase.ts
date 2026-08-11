import { useContext } from "react";

import { ActiveCaseContext } from "@/features/case/context/ActiveCaseContext";

export function useActiveCase() {
  const context = useContext(ActiveCaseContext);

  if (!context) {
    throw new Error(
      "useActiveCase는 ActiveCaseProvider 안에서 사용해야 합니다.",
    );
  }

  return context;
}
