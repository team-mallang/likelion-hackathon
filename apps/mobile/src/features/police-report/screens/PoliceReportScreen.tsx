import { useRouter, type Href } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { createMockPoliceReportService } from "@/features/police-report/services/mockPoliceReport";
import { PoliceReportServiceError } from "@/features/police-report/services/policeReport";
import type {
  PoliceReportDraft,
  PoliceReportLanguage,
} from "@/features/police-report/types/policeReport";
import { PoliceReportView } from "@/features/police-report/views/PoliceReportView";

export function PoliceReportScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const policeReportService = useMemo(
    () => createMockPoliceReportService(),
    [activeCase?.caseId],
  );
  const [draft, setDraft] = useState<PoliceReportDraft | null>(null);
  const [displayLanguage, setDisplayLanguage] =
    useState<PoliceReportLanguage>("ja");
  const [isLoading, setIsLoading] = useState(Boolean(activeCase));
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [regenerationErrorMessage, setRegenerationErrorMessage] = useState<
    string | null
  >(null);
  const [exportErrorMessage, setExportErrorMessage] = useState<string | null>(
    null,
  );
  const requestIdRef = useRef(0);
  const operationIdRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const operationInFlightRef = useRef(false);

  const loadDraft = useCallback(async () => {
    if (!activeCase || requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    setRegenerationErrorMessage(null);
    setExportErrorMessage(null);

    try {
      const result = await policeReportService.getOrCreateDraft({
        caseId: activeCase.caseId,
        accessToken: activeCase.accessToken,
      });

      if (requestId === requestIdRef.current) {
        setDraft(result);
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setDraft(null);
        setErrorMessage(
          error instanceof PoliceReportServiceError
            ? error.message
            : "신고서 초안을 준비하지 못했습니다. 다시 시도해 주세요.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        requestInFlightRef.current = false;
        setIsLoading(false);
      }
    }
  }, [activeCase, policeReportService]);

  useEffect(() => {
    if (!activeCase) {
      setDraft(null);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    setDisplayLanguage("ja");
    setDraft(null);
    void loadDraft();

    return () => {
      requestIdRef.current += 1;
      operationIdRef.current += 1;
      requestInFlightRef.current = false;
      operationInFlightRef.current = false;
    };
  }, [activeCase, loadDraft]);

  if (!activeCase) {
    return (
      <AppScreen
        footer={
          <Button title="홈으로 돌아가기" onPress={() => router.replace("/")} />
        }
        scroll={false}
      >
        <ErrorState message="활성 사건이 없습니다. 사건을 먼저 저장해 주세요." />
      </AppScreen>
    );
  }

  const currentCase = activeCase;

  function handleToggleLanguage() {
    if (operationInFlightRef.current || !draft) {
      return;
    }

    setDisplayLanguage((current) => (current === "ja" ? "ko" : "ja"));
  }

  async function handleRegenerate() {
    if (!draft || operationInFlightRef.current) {
      return;
    }

    const operationId = ++operationIdRef.current;
    operationInFlightRef.current = true;
    setIsRegenerating(true);
    setRegenerationErrorMessage(null);
    setExportErrorMessage(null);

    try {
      const result = await policeReportService.regenerateDraft({
        caseId: currentCase.caseId,
        accessToken: currentCase.accessToken,
        draftId: draft.draftId,
        sourceRevision: draft.sourceRevision,
      });

      if (operationId === operationIdRef.current) {
        setDraft(result);
      }
    } catch (error) {
      if (operationId === operationIdRef.current) {
        setRegenerationErrorMessage(
          error instanceof PoliceReportServiceError
            ? error.message
            : "신고서 초안을 다시 만들지 못했습니다. 다시 시도해 주세요.",
        );
      }
    } finally {
      if (operationId === operationIdRef.current) {
        operationInFlightRef.current = false;
        setIsRegenerating(false);
      }
    }
  }

  function handleRequestRegenerate() {
    if (!draft) {
      return;
    }

    if (draft.status !== "STALE") {
      void handleRegenerate();
      return;
    }

    Alert.alert(
      "신고서 초안 다시 만들기",
      "변경된 사건 정보를 반영해 현재 초안을 다시 만들까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "다시 만들기",
          onPress: () => void handleRegenerate(),
        },
      ],
    );
  }

  async function handleSaveOrShare() {
    if (!draft || operationInFlightRef.current) {
      return;
    }

    const operationId = ++operationIdRef.current;
    operationInFlightRef.current = true;
    setIsExporting(true);
    setExportErrorMessage(null);

    try {
      await policeReportService.createExport({
        caseId: currentCase.caseId,
        accessToken: currentCase.accessToken,
        draftId: draft.draftId,
        version: draft.version,
      });

      if (operationId === operationIdRef.current) {
        setExportErrorMessage(
          "생성된 파일을 전달받았지만 저장·공유 방식이 아직 연결되지 않았습니다.",
        );
      }
    } catch (error) {
      if (operationId === operationIdRef.current) {
        setExportErrorMessage(
          error instanceof PoliceReportServiceError
            ? error.message
            : "신고서 초안을 저장·공유하지 못했습니다. 다시 시도해 주세요.",
        );
      }
    } finally {
      if (operationId === operationIdRef.current) {
        operationInFlightRef.current = false;
        setIsExporting(false);
      }
    }
  }

  const canExport =
    draft?.status === "READY" && draft.missingFieldIds.length === 0;

  return (
    <PoliceReportView
      canExport={canExport}
      displayLanguage={displayLanguage}
      draft={draft}
      errorMessage={errorMessage}
      exportErrorMessage={exportErrorMessage}
      hasUnsavedChanges={false}
      isExporting={isExporting}
      isLoading={isLoading}
      isRegenerating={isRegenerating}
      isSwitchingLanguage={false}
      onBack={() => router.replace("/case/documents" as Href)}
      onCaseTab={() =>
        Alert.alert("준비 중", "사건 화면은 대상 route 확정 후 연결됩니다.")
      }
      onDocumentsTab={() => router.replace("/case/documents" as Href)}
      onEdit={() =>
        Alert.alert(
          "준비 중",
          "내용 수정 범위와 목적 화면이 확정되면 연결됩니다.",
        )
      }
      onGuideTab={() => router.replace("/case/guides" as Href)}
      onRegenerate={handleRequestRegenerate}
      onRetry={() => void loadDraft()}
      onSaveOrShare={() => void handleSaveOrShare()}
      onToggleLanguage={handleToggleLanguage}
      regenerationErrorMessage={regenerationErrorMessage}
      translationErrorMessage={null}
    />
  );
}
