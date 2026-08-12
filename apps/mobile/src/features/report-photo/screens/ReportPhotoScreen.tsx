import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { createExpoReportPhotoCaptureService, createExpoReportPhotoExportService } from "@/features/report-photo/services/expoReportPhoto";
import { reportPhotoNavigationState } from "@/features/report-photo/services/reportPhotoNavigation";
import { ReportPhotoCaptureError } from "@/features/report-photo/services/reportPhotoCapture";
import { ReportPhotoExportError } from "@/features/report-photo/services/reportPhotoExport";
import type { CapturedReportPhoto, ReportPhotoStatus } from "@/features/report-photo/types/reportPhoto";
import { getReportPhotoErrorMessage } from "@/features/report-photo/utils/reportPhotoDisplay";
import { ReportPhotoView } from "@/features/report-photo/views/ReportPhotoView";
import { createMockReportDocumentReviewService } from "@/features/report-document-review/services/mockReportDocumentReview";
import { reportDocumentReviewNavigationState } from "@/features/report-document-review/services/reportDocumentReviewNavigation";

export function ReportPhotoScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const captureService = useMemo(() => createExpoReportPhotoCaptureService(), []);
  const exportService = useMemo(() => createExpoReportPhotoExportService(), []);
  const reviewService = useMemo(() => createMockReportDocumentReviewService(), []);
  const entryPoint = reportPhotoNavigationState.target?.entryPoint ?? null;
  const [status, setStatus] = useState<ReportPhotoStatus>("READY");
  const [photo, setPhoto] = useState<CapturedReportPhoto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      reportPhotoNavigationState.clearTarget();
    },
    [],
  );

  if (!activeCase || !entryPoint) {
    return <AppScreen footer={<Button title="서류함으로 돌아가기" onPress={() => router.replace("/case/documents" as Href)} />} scroll={false}><ErrorState message={!activeCase ? "활성 사건이 없습니다." : "신고서 사진 등록 경로를 확인할 수 없습니다."} /></AppScreen>;
  }

  async function capture(mode: "capture" | "select") {
    if (["REQUESTING_PERMISSION", "CAPTURING", "SELECTING", "EXPORTING"].includes(status)) return;
    const requestId = ++requestIdRef.current;
    setErrorMessage(null);
    setStatus(mode === "capture" ? "CAPTURING" : "SELECTING");
    try {
      const nextPhoto = mode === "capture" ? await captureService.capture() : await captureService.selectFile();
      if (requestId !== requestIdRef.current) return;
      setPhoto(nextPhoto);
      setStatus("PREVIEW");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setStatus("FAILED");
      setErrorMessage(getReportPhotoErrorMessage(error instanceof ReportPhotoCaptureError ? error.code : "CAPTURE_FAILED"));
    }
  }

  async function handleExport() {
    if (!photo || status === "EXPORTING") return;
    const requestId = ++requestIdRef.current;
    setStatus("EXPORTING");
    try {
      const result = await exportService.saveOrShare(photo);
      if (requestId === requestIdRef.current) setStatus(result === "COMPLETED" ? "COMPLETED" : "PREVIEW");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setStatus("FAILED");
      setErrorMessage(getReportPhotoErrorMessage(error instanceof ReportPhotoExportError ? error.code : "EXPORT_FAILED"));
    }
  }

  function clearAndBack(destination?: Href) {
    requestIdRef.current += 1;
    setPhoto(null);
    reportPhotoNavigationState.clearTarget();
    destination ? router.replace(destination) : router.back();
  }

  async function handleReview() {
    if (!photo || status !== "PREVIEW") return;
    try {
      const session = await reviewService.createSession({ source: "S15_REPORT_PHOTO", photo });
      reportDocumentReviewNavigationState.setTarget({ sessionId: session.sessionId, source: "S15_REPORT_PHOTO" });
      router.push("/case/report-review" as Href);
    } catch {
      setStatus("FAILED");
      setErrorMessage("문서 확인을 준비하지 못했습니다. 다시 촬영해 주세요.");
    }
  }

  return <ReportPhotoView entryPoint={entryPoint} captureStatus={status} isCameraSupported={captureService.isCameraSupported} isFileSelectionSupported={captureService.isFileSelectionSupported} photo={photo} errorMessage={errorMessage} onBack={() => clearAndBack()} onCapture={() => void capture("capture")} onSelectFile={() => void capture("select")} onRetry={() => void capture("select")} onReview={() => void handleReview()} onExport={() => void handleExport()} onDiscard={() => { setPhoto(null); setErrorMessage(null); setStatus("READY"); }} onCaseTab={() => clearAndBack("/case" as Href)} onGuideTab={() => clearAndBack("/case/guides" as Href)} onDocumentsTab={() => clearAndBack("/case/documents" as Href)} />;
}
