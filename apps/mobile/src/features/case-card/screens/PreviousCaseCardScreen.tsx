import { useRouter, type Href } from "expo-router";
import { Alert } from "react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppScreen } from "@/components/layout/AppScreen";
import { ErrorState } from "@/components/feedback/ErrorState";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import {
  PreviousCaseCardServiceError,
  previousCaseCardService,
} from "@/features/case-card/services/caseCard";
import type { PreviousCaseCard } from "@/features/case-card/types/caseCard";
import { PreviousCaseCardView } from "@/features/case-card/views/PreviousCaseCardView";

export function PreviousCaseCardScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const [caseCard, setCaseCard] = useState<PreviousCaseCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const canLoad = Boolean(
    activeCase?.source === "RESTORED" && activeCase.accessToken,
  );

  const loadCaseCard = useCallback(async () => {
    if (!activeCase || activeCase.source !== "RESTORED" || !activeCase.accessToken) {
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await previousCaseCardService.get(
        activeCase.caseId,
        activeCase.accessToken,
      );

      if (requestId === requestIdRef.current) {
        setCaseCard(result);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(
          error instanceof PreviousCaseCardServiceError
            ? error.message
            : "이전 사건카드를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeCase]);

  useEffect(() => {
    void loadCaseCard();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadCaseCard]);

  if (!canLoad) {
    return (
      <AppScreen scroll={false}>
        <ErrorState
          message="이전 사건을 먼저 조회해 주세요."
          onRetry={() => router.replace("/case/lookup" as Href)}
        />
      </AppScreen>
    );
  }

  return (
    <PreviousCaseCardView
      caseCard={caseCard}
      errorMessage={errorMessage}
      isLoading={isLoading}
      onBack={() => router.replace("/case/documents" as Href)}
      onCaseTab={() => Alert.alert("준비 중", "사건 화면은 준비 중입니다.")}
      onDocumentsTab={() => router.replace("/case/documents" as Href)}
      onGuideTab={() => Alert.alert("준비 중", "행동 가이드는 준비 중입니다.")}
      onOpenMap={() => Alert.alert("준비 중", "지도 연결은 정책 확정 후 제공됩니다.")}
      onRetry={() => void loadCaseCard()}
    />
  );
}
