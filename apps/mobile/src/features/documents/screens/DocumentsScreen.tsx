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
import {
  cleanupPreparedCaseExport,
  prepareCaseExportPackage,
  schedulePreparedCaseExportCleanup,
  type PreparedCaseExport,
} from "@/features/documents/services/exportCasePackage";
import { sendPreparedCaseExportByEmail } from "@/features/documents/services/exportDelivery";
import { apiGuidesService } from "@/features/guides/services/apiGuides";
import type { DocumentsOverview } from "@/features/documents/types/documents";
import { DocumentsView } from "@/features/documents/views/DocumentsView";
import { reportPhotoNavigationState } from "@/features/report-photo/services/reportPhotoNavigation";
import { insuranceProductsNavigationState } from "@/features/insurance-products/services/insuranceProductsNavigation";
import { getPoliceConversation } from "@/features/police-support/services/policeConversation";
import type {
  DocumentsExportRequest,
  EvidenceActionError,
  EvidenceFileViewModel,
} from "@/features/documents/views/DocumentsView.types";

type SessionEvidence = {
  id: string;
  uri: string;
  mimeType?: string;
  createdAt: number;
};

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
  const [sessionEvidence, setSessionEvidence] = useState<SessionEvidence[]>([]);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);
  const [previewEvidence, setPreviewEvidence] = useState<EvidenceFileViewModel | null>(null);
  const [isExporting, setIsExporting] = useState(false);

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

      const [caseCard, guides] = await Promise.all([
        previousCaseCardService.get(activeCase.caseId, activeCase.accessToken),
        apiGuidesService.getOverview({ caseId: activeCase.caseId, accessToken: activeCase.accessToken }),
      ]);
      if (requestId !== requestIdRef.current) return;
      setOverview({
        caseId: caseCard.caseId,
        caseNumber: formatCaseNumber(caseCard.caseNumber),
        reportStatusLabel: caseCard.reportStatusLabel,
        progressPercent: guides.progressPercent,
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
          ...(getPoliceConversation(activeCase.caseId).length > 0
            ? [{
                id: "police-conversation",
                kind: "POLICE_CONVERSATION" as const,
                title: "경찰서 대화",
                description: "현장 대응에서 완료된 원문과 번역 대화 기록입니다.",
                status: "READY" as const,
              }]
            : []),
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
      setSessionEvidence([]);
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

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  const evidenceFiles = useMemo<EvidenceFileViewModel[]>(
    () =>
      [
        ...(overview?.evidenceFiles ?? []),
        ...sessionEvidence.map((item) => ({
          id: item.id,
          kind: "POLICE_REPORT_PHOTO" as const,
          title: "촬영한 증빙사진",
          description: item.mimeType ?? "이미지 증빙서류",
          registeredAt: new Date(item.createdAt).toISOString(),
          deliveryDescription: "현재 서류함 세션에서만 보관",
          localUri: item.uri,
          previewUri: item.uri,
          canDelete: true,
        })),
      ].map(
        ({ registeredAt, ...evidence }) => ({
          ...evidence,
          registeredAtLabel: formatRegisteredAt(registeredAt),
          previewUri: "previewUri" in evidence && typeof evidence.previewUri === "string" ? evidence.previewUri : evidence.localUri,
          canDelete: "canDelete" in evidence && evidence.canDelete === true,
        }),
      ),
    [sessionEvidence, overview?.evidenceFiles],
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

    if (document?.kind === "POLICE_CONVERSATION") {
      router.push("/case/police-conversation" as Href);
      return;
    }

    Alert.alert(
      "준비 중",
      "사건 카드 상세는 S08 화면이 준비되면 연결할 예정입니다.",
    );
  }

  async function handleCaptureEvidence() {
    const caseId = activeCase?.caseId;
    if (!caseId || captureInFlightRef.current) return;
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
      setSessionEvidence((current) => [{ id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, uri: asset.uri, mimeType: asset.mimeType ?? undefined, createdAt: Date.now() }, ...current]);
      Alert.alert(
        "증빙자료에 추가됨",
        "사진은 현재 서류함 세션에서만 보관됩니다.",
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

    if (!evidence?.previewUri) {
      reportPhotoNavigationState.setTarget({ entryPoint: "S07_DOCUMENTS" });
      router.push("/case/report-photo" as Href);
      return;
    }

    setPreviewEvidence(evidence);
  }

  function handleDeleteEvidence(evidenceId: string) {
    const evidence = evidenceFiles.find((item) => item.id === evidenceId);
    if (!evidence?.canDelete) return;
    Alert.alert("증빙사진 삭제", "현재 서류함 세션에서 이 사진을 제거하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: () => void performDeleteEvidence(evidenceId) },
    ]);
  }

  function performDeleteEvidence(evidenceId: string) {
    if (deletingEvidenceId) return;
    setDeletingEvidenceId(evidenceId);
    setEvidenceActionError(null);
    setSessionEvidence((current) => current.filter((item) => item.id !== evidenceId));
    if (previewEvidence?.id === evidenceId) setPreviewEvidence(null);
    setDeletingEvidenceId(null);
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
    if (isExporting) return;
    const exportCase = activeCase;
    if (!exportCase) return;
    setIsExporting(true);
    let prepared: PreparedCaseExport | null = null;
    try {
      prepared = await prepareCaseExportPackage({ caseId: exportCase.caseId, caseNumber: exportCase.caseNumber, accessToken: exportCase.accessToken ?? "", evidence: sessionEvidence });
      await sendPreparedCaseExportByEmail(prepared, request.email);
      // Android mail clients can read attachments after the composer closes.
      // Keep the ZIP alive long enough for that background handoff to finish.
      schedulePreparedCaseExportCleanup(prepared);
      prepared = null;
    } catch (error) {
      const message = error instanceof Error && error.message === "MAIL_UNAVAILABLE"
        ? "사용 가능한 이메일 앱이 없습니다."
        : "자료를 내보내지 못했습니다. 다시 시도해 주세요.";
      Alert.alert("내보내기 실패", message);
    } finally {
      if (prepared) cleanupPreparedCaseExport(prepared);
      setIsExporting(false);
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
      deletingEvidenceId={deletingEvidenceId}
      previewEvidence={previewEvidence}
      onHome={() => router.replace("/")}
      onBack={handleBack}
      onRetry={() => void loadOverview()}
      onCopyCaseNumber={() => void handleCopyCaseNumber()}
      onOpenCaseGuide={handleOpenCaseGuide}
      onOpenDocument={handleOpenDocument}
      onOpenEvidence={handleOpenEvidence}
      onShareEvidence={(evidenceId) => void handleShareEvidence(evidenceId)}
      onDeleteEvidence={handleDeleteEvidence}
      onCloseEvidencePreview={() => setPreviewEvidence(null)}
      onCaptureEvidence={() => void handleCaptureEvidence()}
      onExportDocuments={handleExportDocuments}
      isExporting={isExporting}
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
