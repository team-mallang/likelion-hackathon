import * as Clipboard from "expo-clipboard";
import * as ImagePicker from "expo-image-picker";
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
import {
  PreviousCaseCardServiceError,
  previousCaseCardService,
} from "@/features/case-card/services/caseCard";
import { inspectDocument } from "@/features/documents/services/documentInspection";
import { deleteTemporaryImage, listLocalEvidence, persistEvidence } from "@/features/documents/services/localEvidence";
import type { DocumentsOverview } from "@/features/documents/types/documents";
import { DocumentsView } from "@/features/documents/views/DocumentsView";
import { reportPhotoNavigationState } from "@/features/report-photo/services/reportPhotoNavigation";
import { insuranceProductsNavigationState } from "@/features/insurance-products/services/insuranceProductsNavigation";
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
  const [overview, setOverview] = useState<DocumentsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(activeCase));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyFeedbackVisible, setCopyFeedbackVisible] = useState(false);
  const [sharingEvidenceId, setSharingEvidenceId] = useState<string | null>(
    null,
  );
  const [evidenceActionError, setEvidenceActionError] =
    useState<EvidenceActionError | null>(null);
  const [isInspectingEvidence, setIsInspectingEvidence] = useState(false);
  const requestIdRef = useRef(0);
  const requestInFlightRef = useRef(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareInFlightRef = useRef(false);
  const captureInFlightRef = useRef(false);
  const temporaryImageRef = useRef<string | null>(null);

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
      if (!activeCase.accessToken) {
        throw new PreviousCaseCardServiceError(
          "AUTHENTICATION_REQUIRED",
          "현재 사건 정보를 불러오려면 다시 인증해 주세요.",
        );
      }

      const caseCard = await previousCaseCardService.get(
        activeCase.caseId,
        activeCase.accessToken,
      );
      if (requestId !== requestIdRef.current) return;
      setOverview({
        caseId: caseCard.caseId,
        caseNumber: formatCaseNumber(caseCard.caseNumber),
        reportStatusLabel: caseCard.reportStatusLabel,
        progressPercent: 0,
        documents: [
          {
            id: "case-card",
            kind: "CASE_CARD",
            title: "사건 카드",
            description: caseCard.aiSummary ?? "현재 사건 정보 보기",
            status: "READY",
          },
          {
            id: "police-report-draft",
            kind: "POLICE_REPORT_DRAFT",
            title: "경찰서 신고서 초안",
            description: "현재 사건 정보를 바탕으로 초안을 생성합니다.",
            status: "READY",
          },
        ],
        evidenceFiles: [],
      });
    } catch (error) {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setOverview(null);
      setErrorMessage(
        error instanceof PreviousCaseCardServiceError
          ? error.message
          : "서류 정보를 불러오지 못했습니다. 다시 시도해 주세요.",
      );
    } finally {
      if (requestId === requestIdRef.current) {
        requestInFlightRef.current = false;
        setIsLoading(false);
      }
    }
  }, [activeCase]);

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
      deleteTemporaryImage(temporaryImageRef.current);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const evidenceFiles = useMemo<EvidenceFileViewModel[]>(
    () =>
      [
        ...(overview?.evidenceFiles ?? []),
        ...listLocalEvidence().map((item) => ({
          id: item.id,
          kind: "POLICE_REPORT_PHOTO" as const,
          title: "제출용 문서 사진",
          description: item.documentType,
          registeredAt: item.createdAt,
          deliveryDescription: "기기에 로컬 보관됨",
          localUri: item.uri,
        })),
      ].map(
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
    router.push("/case/guides" as Href);
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

    if (document?.kind === "CASE_CARD") {
      router.push("/case/card" as Href);
      return;
    }

    Alert.alert(
      "준비 중",
      "사건 카드 상세는 S08 화면이 준비되면 연결할 예정입니다.",
    );
  }

  async function handleCaptureEvidence() {
    if (captureInFlightRef.current) return;
    captureInFlightRef.current = true;
    setIsInspectingEvidence(true);
    let uri: string | null = null;
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("카메라 권한 필요", "문서 촬영을 위해 카메라 권한을 허용해주세요.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      uri = asset.uri;
      temporaryImageRef.current = uri;
      const inspection = await inspectDocument(uri, asset.mimeType ?? "image/jpeg");
      if (!inspection.usable) {
        Alert.alert("재촬영이 필요합니다", [...inspection.issues, inspection.recommendation].filter(Boolean).join("\n"));
        return;
      }
      persistEvidence(uri, inspection.documentType, asset.mimeType ?? "image/jpeg");
      temporaryImageRef.current = null;
      setOverview((current) => (current ? { ...current } : current));
      Alert.alert("보관 완료", "제출 가능한 문서를 이 기기에 보관했습니다.");
    } catch {
      Alert.alert("문서 검사 실패", "문서 품질을 검사하지 못했습니다. 다시 촬영해주세요.");
    } finally {
      if (temporaryImageRef.current === uri) {
        deleteTemporaryImage(uri);
        temporaryImageRef.current = null;
      }
      captureInFlightRef.current = false;
      setIsInspectingEvidence(false);
    }
  }

  function handleOpenEvidence(evidenceId: string) {
    const evidence = evidenceFiles.find(
      (item) => item.id === evidenceId,
    );
    setEvidenceActionError(null);

    if (!evidence?.localUri) {
      reportPhotoNavigationState.setTarget({ entryPoint: "S07_DOCUMENTS" });
      router.push("/case/report-photo" as Href);
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

    const evidence = evidenceFiles.find(
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
      isInspectingEvidence={isInspectingEvidence}
      onHome={() => router.replace("/")}
      onBack={() => router.back()}
      onRetry={() => void loadOverview()}
      onCopyCaseNumber={() => void handleCopyCaseNumber()}
      onOpenCaseGuide={handleOpenCaseGuide}
      onOpenDocument={handleOpenDocument}
      onOpenEvidence={handleOpenEvidence}
      onShareEvidence={(evidenceId) => void handleShareEvidence(evidenceId)}
      onCaptureEvidence={() => void handleCaptureEvidence()}
      onOpenInsuranceProducts={() => { insuranceProductsNavigationState.setTarget({ source: "S06_DOCUMENTS" }); router.push("/case/insurance-products" as Href); }}
      onCaseTab={handleOpenCaseTab}
      onGuideTab={() => router.replace("/case/guides" as Href)}
      onDocumentsTab={() => {}}
    />
  );
}
