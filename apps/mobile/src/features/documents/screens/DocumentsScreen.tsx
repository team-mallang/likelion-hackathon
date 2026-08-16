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
import { documentsNavigationState } from "@/features/documents/services/documentsNavigation";
import { addSessionEvidence, clearSessionEvidence, listSessionEvidence } from "@/features/documents/services/localEvidence";
import type { DocumentsOverview } from "@/features/documents/types/documents";
import { DocumentsView } from "@/features/documents/views/DocumentsView";
import { reportPhotoNavigationState } from "@/features/report-photo/services/reportPhotoNavigation";
import { insuranceProductsNavigationState } from "@/features/insurance-products/services/insuranceProductsNavigation";
import type {
  DocumentsExportRequest,
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
  const [evidenceRevision, setEvidenceRevision] = useState(0);

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
      clearSessionEvidence();
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const evidenceFiles = useMemo<EvidenceFileViewModel[]>(
    () =>
      [
        ...(overview?.evidenceFiles ?? []),
        ...listSessionEvidence().map((item) => ({
          id: item.id,
          kind: "POLICE_REPORT_PHOTO" as const,
          title: "경찰 발급 증명서",
          description: item.documentType,
          registeredAt: item.createdAt,
          deliveryDescription: "현재 화면에서만 임시 보관",
          localUri: item.uri,
        })),
      ].map(
        ({ registeredAt, ...evidence }) => ({
          ...evidence,
          registeredAtLabel: formatRegisteredAt(registeredAt),
        }),
      ),
    [evidenceRevision, overview?.evidenceFiles],
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
    documentsNavigationState.clearReturnTarget();
    router.push("/case/guides" as Href);
  }

  function handleBack() {
    if (
      documentsNavigationState.consumeReturnTarget() === "POLICE_SUPPORT"
    ) {
      router.replace("/case/police-support" as Href);
      return;
    }

    router.back();
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
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("카메라 권한 필요", "문서 촬영을 위해 카메라 권한을 허용해주세요.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 1 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      addSessionEvidence(asset.uri);
      setEvidenceRevision((current) => current + 1);
      Alert.alert(
        "증빙자료에 추가됨",
        "이 사진은 서버나 앱 저장소에 보관되지 않으며, 현재 화면에서 모든 자료를 내보낼 때만 함께 전송할 수 있습니다.",
      );
    } catch {
      Alert.alert("문서 촬영 실패", "문서를 촬영하지 못했습니다. 다시 시도해주세요.");
    } finally {
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

  async function handleExportDocuments(request: DocumentsExportRequest) {
    const attachment = evidenceFiles.find((item) => item.localUri)?.localUri;

    try {
      await Share.share({
        title: "Travel Guard 서류",
        message:
          request.method === "EMAIL"
            ? `${request.email}로 신고서 초안과 증빙자료를 보냅니다.`
            : "신고서 초안과 증빙자료를 저장합니다.",
        ...(attachment ? { url: attachment } : {}),
      });
    } catch {
      Alert.alert("내보내기 실패", "기기의 공유 메뉴를 열지 못했습니다. 다시 시도해주세요.");
      return;
    }

    if (request.method === "EMAIL") {
      Alert.alert(
        "이메일 내보내기",
        `${request.email} 주소로 신고서 초안과 현재 증빙자료를 전송할 수 있도록 준비했습니다. 기기의 메일 앱에서 전송을 완료해 주세요.`,
      );
      return;
    }

    Alert.alert(
      "갤러리 내보내기",
      "신고서 초안과 현재 증빙자료를 기기의 갤러리 또는 공유 메뉴에서 저장할 수 있습니다.",
    );
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
      onBack={handleBack}
      onRetry={() => void loadOverview()}
      onCopyCaseNumber={() => void handleCopyCaseNumber()}
      onOpenCaseGuide={handleOpenCaseGuide}
      onOpenDocument={handleOpenDocument}
      onOpenEvidence={handleOpenEvidence}
      onShareEvidence={(evidenceId) => void handleShareEvidence(evidenceId)}
      onCaptureEvidence={() => void handleCaptureEvidence()}
      onExportDocuments={handleExportDocuments}
      onOpenInsuranceProducts={() => { insuranceProductsNavigationState.setTarget({ source: "S06_DOCUMENTS" }); router.push("/case/insurance-products" as Href); }}
      onCaseTab={handleOpenCaseTab}
      onGuideTab={() => {
        documentsNavigationState.clearReturnTarget();
        router.replace("/case/guides" as Href);
      }}
      onDocumentsTab={() => {}}
    />
  );
}
