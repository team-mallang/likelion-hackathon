import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Linking } from "react-native";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { documentScanNavigationState } from "@/features/document-scan/services/documentScanNavigation";
import { createExpoDocumentCaptureService, DocumentCaptureError } from "@/features/document-scan/services/documentCapture";
import { createMockDocumentScanService } from "@/features/document-scan/services/mockDocumentScan";
import { DocumentScanServiceError } from "@/features/document-scan/services/documentScan";
import type { DocumentScanResult, ScanStatus } from "@/features/document-scan/types/documentScan";
import { getDocumentScanErrorMessage } from "@/features/document-scan/utils/documentScanDisplay";
import { DocumentScanView } from "@/features/document-scan/views/DocumentScanView";

export function DocumentScanScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const documentScanService = useMemo(() => createMockDocumentScanService(), []);
  const captureService = useMemo(() => createExpoDocumentCaptureService(), []);
  const [scanStatus, setScanStatus] = useState<ScanStatus>("READY");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentScanResult | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => () => { requestIdRef.current += 1; }, []);

  if (!activeCase) {
    return <AppScreen footer={<Button title="처음으로 돌아가기" onPress={() => router.replace("/")} />} scroll={false}><ErrorState message="활성 사건이 없습니다." /></AppScreen>;
  }
  const currentCase = activeCase;

  async function handleStartScan() {
    if (scanStatus === "REQUESTING_PERMISSION" || scanStatus === "CAPTURING" || scanStatus === "ANALYZING") return;
    const requestId = ++requestIdRef.current;
    setErrorMessage(null);
    setResult(null);
    setScanStatus("REQUESTING_PERMISSION");
    try {
      const capturedDocument = await captureService.capture();
      if (requestId !== requestIdRef.current) return;
      setScanStatus("CAPTURING");
      // The URI is deliberately discarded here: OCR upload is not approved or connected yet.
      void capturedDocument;
      setScanStatus("ANALYZING");
      // Stage 4 uses a typed mock job only. OCR upload/analysis is deliberately deferred.
      const job = await documentScanService.start({ caseId: currentCase.caseId, accessToken: currentCase.accessToken });
      const nextResult = await documentScanService.getResult({ caseId: currentCase.caseId, accessToken: currentCase.accessToken, scanJobId: job.scanJobId });
      if (requestId !== requestIdRef.current) return;
      setResult(nextResult);
      documentScanNavigationState.setTarget({ scanJobId: nextResult.scanJobId });
      setScanStatus("SUCCESS");
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      setScanStatus("FAILED");
      setErrorMessage(error instanceof DocumentCaptureError ? getDocumentScanErrorMessage(error.code) : error instanceof DocumentScanServiceError ? getDocumentScanErrorMessage(error.code) : getDocumentScanErrorMessage("ANALYSIS_FAILED"));
    }
  }

  function handleBack() {
    requestIdRef.current += 1;
    documentScanNavigationState.clearTarget();
    router.back();
  }

  function navigateWithoutScanTarget(destination: Href) {
    requestIdRef.current += 1;
    documentScanNavigationState.clearTarget();
    router.replace(destination);
  }

  async function handleOpenSettings() {
    try {
      await Linking.openSettings();
    } catch {
      setErrorMessage("기기 설정을 열 수 없습니다. 카메라 권한을 확인해 주세요.");
    }
  }

  return <DocumentScanView scanStatus={scanStatus} isCameraSupported={captureService.isCameraSupported} errorMessage={errorMessage} result={result} onBack={handleBack} onStartScan={() => void handleStartScan()} onRetry={() => void handleStartScan()} onOpenSettings={() => void handleOpenSettings()} onReviewDraft={() => router.replace("/case/report" as Href)} onCaseTab={handleBack} onGuideTab={() => navigateWithoutScanTarget("/case/guides" as Href)} onDocumentsTab={() => navigateWithoutScanTarget("/case/documents" as Href)} />;
}
