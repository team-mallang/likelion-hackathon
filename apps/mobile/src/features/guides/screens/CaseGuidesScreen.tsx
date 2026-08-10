import { useRouter, type Href } from "expo-router";
import { Alert } from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import {
  CaseGuidesServiceError,
} from "@/features/guides/services/guides";
import { createMockGuidesService } from "@/features/guides/services/mockGuides";
import type { CaseGuidesOverview } from "@/features/guides/types/guides";
import { CaseGuidesView } from "@/features/guides/views/CaseGuidesView";

export function CaseGuidesScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const guidesService = useMemo(
    () => createMockGuidesService({ caseNumber: activeCase?.caseNumber }),
    [activeCase?.caseNumber],
  );
  const [overview, setOverview] = useState<CaseGuidesOverview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(activeCase));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingGuideId, setUpdatingGuideId] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const loadGuides = useCallback(async () => {
    if (!activeCase) {
      setOverview(null);
      setIsLoading(false);
      setErrorMessage("사건을 먼저 시작하거나 이전 사건을 조회해 주세요.");
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await guidesService.getOverview({
        caseId: activeCase.caseId,
        accessToken: activeCase.accessToken ?? "",
      });

      if (requestId === requestIdRef.current) {
        setOverview(result);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setErrorMessage(
          error instanceof CaseGuidesServiceError
            ? error.message
            : "행동 가이드를 불러오지 못했습니다. 다시 시도해 주세요.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [activeCase, guidesService]);

  useEffect(() => {
    void loadGuides();

    return () => {
      requestIdRef.current += 1;
    };
  }, [loadGuides]);

  async function handleCompleteGuide(guideId: string) {
    if (!activeCase || updatingGuideId) {
      return;
    }

    setUpdatingGuideId(guideId);

    try {
      await guidesService.updateCompletion({
        caseId: activeCase.caseId,
        accessToken: activeCase.accessToken ?? "",
        guideId,
        completionStatus: "COMPLETED",
      });
      await loadGuides();
    } catch (error) {
      Alert.alert(
        "완료 상태 저장 실패",
        error instanceof CaseGuidesServiceError
          ? error.message
          : "완료 상태를 저장하지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      setUpdatingGuideId(null);
    }
  }

  function handleRunGuideAction(guideId: string) {
    const guide = overview?.guides.find((item) => item.guideId === guideId);
    Alert.alert(
      "준비 중",
      guide?.actionLabel
        ? `${guide.actionLabel} 기능은 목적 화면과 권한 정책이 확정되면 연결됩니다.`
        : "이 행동의 후속 기능은 준비 중입니다.",
    );
  }

  return (
    <CaseGuidesView
      errorMessage={errorMessage}
      isLoading={isLoading}
      onBack={() => router.back()}
      onCaseTab={() => Alert.alert("준비 중", "사건 화면은 준비 중입니다.")}
      onCompleteGuide={(guideId) => void handleCompleteGuide(guideId)}
      onDocumentsTab={() => router.replace("/case/documents" as Href)}
      onGuideTab={() => {}}
      onRetry={() => void loadGuides()}
      onRunGuideAction={handleRunGuideAction}
      overview={overview}
      updatingGuideId={updatingGuideId}
    />
  );
}
