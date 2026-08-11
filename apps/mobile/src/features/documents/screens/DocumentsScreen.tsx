import * as Clipboard from "expo-clipboard";
import { useRouter, type Href } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Share } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { formatCaseNumber } from "@/features/case/utils/formatCaseNumber";
import { DocumentsServiceError } from "@/features/documents/services/documents";
import { createMockDocumentsService } from "@/features/documents/services/mockDocuments";
import type { DocumentsOverview } from "@/features/documents/types/documents";
import { DocumentsView } from "@/features/documents/views/DocumentsView";
import type {
  EvidenceActionError,
  EvidenceFileViewModel,
} from "@/features/documents/views/DocumentsView.types";

function formatRegisteredAt(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)} 등록`;
}

export function DocumentsScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const documentsService = useMemo(
    () => createMockDocumentsService(activeCase?.caseNumber ?? ""),
    [activeCase?.caseNumber],
  );
  const [overview, setOverview] = useState<DocumentsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(activeCase));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyFeedbackVisible, setCopyFeedbackVisible] = useState(false);
  const [sharingEvidenceId, setSharingEvidenceId] = useState<string | null>(
    null,
  );
  const [evidenceActionError, setEvidenceActionError] =
    useState<EvidenceActionError | null>(null);
  const requestIdRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareInFlightRef = useRef(false);

  const loadOverview = useCallback(async () => {
    if (!activeCase || requestInFlightRef.current) {
      return;
    }

    requestInFlightRef.current = true;
    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setErrorMessage(null);
    setEvidenceActionError(null);

    try {
      const result = await documentsService.getOverview(activeCase.caseId);

      if (requestId !== requestIdRef.current) {
        return;
      }

      setOverview({
        ...result,
        caseNumber: formatCaseNumber(activeCase.caseNumber),
        progressPercent: Math.min(Math.max(result.progressPercent, 0), 100),
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setOverview(null);
      setErrorMessage(
        error instanceof DocumentsServiceError
          ? error.message
          : "서류 정보를 불러오지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        requestInFlightRef.current = false;
        setIsLoading(false);
      }
    }
  }, [activeCase, documentsService]);

  useEffect(() => {
    if (!activeCase) {
      setOverview(null);
      setIsLoading(false);
      setErrorMessage(null);
      return;
    }

    void loadOverview();

    return () => {
      requestIdRef.current += 1;
      requestInFlightRef.current = false;
    };
  }, [activeCase, loadOverview]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const evidenceFiles = useMemo<EvidenceFileViewModel[]>(
    () =>
      (overview?.evidenceFiles ?? []).map(
        ({ registeredAt, ...evidence }) => ({
          ...evidence,
          registeredAtLabel: formatRegisteredAt(registeredAt),
        }),
      ),
    [overview?.evidenceFiles],
  );

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

  async function handleCopyCaseNumber() {
    try {
      await Clipboard.setStringAsync(
        overview?.caseNumber ?? formatCaseNumber(activeCase?.caseNumber ?? ""),
      );
      setCopyFeedbackVisible(true);

      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }

      copyTimerRef.current = setTimeout(() => {
        setCopyFeedbackVisible(false);
        copyTimerRef.current = null;
      }, 2_000);
    } catch {
      Alert.alert("복사 실패", "사건번호를 복사하지 못했습니다.");
    }
  }

  function handleOpenCaseGuide() {
    Alert.alert(
      "준비 중",
      "사건 가이드는 S11 화면이 준비되면 연결할 예정입니다.",
    );
  }

  function handleOpenCaseTab() {
    Alert.alert(
      "준비 중",
      "사건 화면은 대상 화면이 확정되면 연결할 예정입니다.",
    );
  }

  function handleOpenDocument(documentId: string) {
    const document = overview?.documents.find((item) => item.id === documentId);

    if (document?.kind === "POLICE_REPORT_DRAFT") {
      router.push("/case/report" as Href);
      return;
    }

    if (document?.kind === "CASE_CARD" && activeCase?.source === "RESTORED") {
      router.push("/case/card" as Href);
      return;
    }

    Alert.alert(
      "준비 중",
      "사건 카드 상세는 S08 화면이 준비되면 연결할 예정입니다.",
    );
  }

  function handleOpenEvidence(evidenceId: string) {
    const evidence = overview?.evidenceFiles.find(
      (item) => item.id === evidenceId,
    );
    setEvidenceActionError(null);

    if (!evidence?.localUri) {
      setEvidenceActionError({
        evidenceId,
        message: "미리 볼 증빙 파일이 아직 준비되지 않았습니다.",
      });
      return;
    }

    Alert.alert(
      "준비 중",
      "증빙 미리보기 정책이 확정되면 연결할 예정입니다.",
    );
  }

  async function handleShareEvidence(evidenceId: string) {
    if (shareInFlightRef.current) {
      return;
    }

    const evidence = overview?.evidenceFiles.find(
      (item) => item.id === evidenceId,
    );
    setEvidenceActionError(null);

    if (!evidence?.localUri) {
      setEvidenceActionError({
        evidenceId,
        message: "공유할 파일이 아직 준비되지 않았습니다.",
      });
      return;
    }

    shareInFlightRef.current = true;
    setSharingEvidenceId(evidenceId);

    try {
      await Share.share({
        title: evidence.title,
        message: evidence.description,
        url: evidence.localUri,
      });
    } catch {
      setEvidenceActionError({
        evidenceId,
        message: "증빙 파일을 공유하지 못했습니다. 다시 시도해 주세요.",
      });
    } finally {
      shareInFlightRef.current = false;
      setSharingEvidenceId(null);
    }
  }

  return (
    <DocumentsView
      caseNumber={
        overview?.caseNumber ?? formatCaseNumber(activeCase.caseNumber)
      }
      reportStatusLabel={overview?.reportStatusLabel ?? ""}
      progressPercent={overview?.progressPercent ?? 0}
      documents={overview?.documents ?? []}
      evidenceFiles={evidenceFiles}
      isLoading={isLoading}
      errorMessage={errorMessage}
      copyFeedbackVisible={copyFeedbackVisible}
      sharingEvidenceId={sharingEvidenceId}
      evidenceActionError={evidenceActionError}
      onBack={() => router.back()}
      onRetry={() => void loadOverview()}
      onCopyCaseNumber={() => void handleCopyCaseNumber()}
      onOpenCaseGuide={handleOpenCaseGuide}
      onOpenDocument={handleOpenDocument}
      onOpenEvidence={handleOpenEvidence}
      onShareEvidence={(evidenceId) => void handleShareEvidence(evidenceId)}
      onCaseTab={handleOpenCaseTab}
      onGuideTab={handleOpenCaseGuide}
      onDocumentsTab={() => {}}
    />
  );
}
