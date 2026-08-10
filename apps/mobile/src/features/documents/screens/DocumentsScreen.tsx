import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Share } from "react-native";

import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import type {
  EvidenceFile,
  GeneratedDocument,
} from "@/features/documents/types/documents";
import { DocumentsView } from "@/features/documents/views/DocumentsView";
import type {
  EvidenceActionError,
  EvidenceFileViewModel,
} from "@/features/documents/views/DocumentsView.types";

const previewDocuments: GeneratedDocument[] = [
  {
    id: "case-card-final",
    kind: "CASE_CARD",
    title: "사건 카드 (최종)",
    description: "입력하신 상황을 바탕으로 구조화된 정보",
    status: "READY",
  },
  {
    id: "police-report-draft",
    kind: "POLICE_REPORT_DRAFT",
    title: "경찰서 신고서 초안",
    description: "일본 경찰서 제출용 일본어 번역 포함",
    status: "READY",
  },
];

const previewEvidenceFiles: EvidenceFile[] = [
  {
    id: "police-report-photo",
    kind: "POLICE_REPORT_PHOTO",
    title: "업로드한 신고서 사진",
    description: "신고서 촬영·등록 기능 연결 예정",
    registeredAt: "2026-08-11T12:00:00.000Z",
    deliveryDescription: "이메일 전송 기록 없음",
    localUri: null,
  },
];

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

const previewEvidenceViewModels: EvidenceFileViewModel[] =
  previewEvidenceFiles.map(({ registeredAt, ...evidence }) => ({
    ...evidence,
    registeredAtLabel: formatRegisteredAt(registeredAt),
  }));

export function DocumentsScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const [copyFeedbackVisible, setCopyFeedbackVisible] = useState(false);
  const [sharingEvidenceId, setSharingEvidenceId] = useState<string | null>(
    null,
  );
  const [evidenceActionError, setEvidenceActionError] =
    useState<EvidenceActionError | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shareInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  if (!activeCase) {
    return (
      <AppScreen scroll={false}>
        <ErrorState message="활성 사건이 없습니다. 사건을 먼저 저장해 주세요." />
      </AppScreen>
    );
  }

  async function handleCopyCaseNumber() {
    if (!activeCase) {
      return;
    }

    try {
      await Clipboard.setStringAsync(activeCase.caseNumber);
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

  function handleOpenDocument(documentId: string) {
    const document = previewDocuments.find((item) => item.id === documentId);

    Alert.alert(
      "준비 중",
      document?.kind === "POLICE_REPORT_DRAFT"
        ? "경찰서 신고서 초안은 S09 화면이 준비되면 연결할 예정입니다."
        : "사건 카드 상세는 S08 화면이 준비되면 연결할 예정입니다.",
    );
  }

  function handleOpenEvidence(evidenceId: string) {
    const evidence = previewEvidenceFiles.find((item) => item.id === evidenceId);
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

    const evidence = previewEvidenceFiles.find((item) => item.id === evidenceId);
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
      caseNumber={activeCase.caseNumber}
      reportStatusLabel="신고 완료"
      progressPercent={80}
      documents={previewDocuments}
      evidenceFiles={previewEvidenceViewModels}
      isLoading={false}
      errorMessage={null}
      copyFeedbackVisible={copyFeedbackVisible}
      sharingEvidenceId={sharingEvidenceId}
      evidenceActionError={evidenceActionError}
      onBack={() => router.back()}
      onRetry={() => {}}
      onCopyCaseNumber={() => void handleCopyCaseNumber()}
      onOpenCaseGuide={handleOpenCaseGuide}
      onOpenDocument={handleOpenDocument}
      onOpenEvidence={handleOpenEvidence}
      onShareEvidence={(evidenceId) => void handleShareEvidence(evidenceId)}
      onCaseTab={() => {}}
      onGuideTab={() => {}}
      onDocumentsTab={() => {}}
    />
  );
}
