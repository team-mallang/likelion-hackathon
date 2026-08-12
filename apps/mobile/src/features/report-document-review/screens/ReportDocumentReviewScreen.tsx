import { useRouter, type Href } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/common/button";
import { ErrorState } from "@/components/feedback/ErrorState";
import { AppScreen } from "@/components/layout/AppScreen";
import { useActiveCase } from "@/features/case/hooks/useActiveCase";
import { reportDocumentReviewNavigationState } from "@/features/report-document-review/services/reportDocumentReviewNavigation";
import { createMockReportDocumentReviewService } from "@/features/report-document-review/services/mockReportDocumentReview";
import { ReportDocumentReviewError, hasRequiredReviewFields } from "@/features/report-document-review/services/reportDocumentReview";
import type { ReportDocumentField, ReportDocumentFieldKey, ReportDocumentReviewStatus } from "@/features/report-document-review/types/reportDocumentReview";
import { ReportDocumentReviewView } from "@/features/report-document-review/views/ReportDocumentReviewView";

export function ReportDocumentReviewScreen() {
  const router = useRouter();
  const { activeCase } = useActiveCase();
  const service = useMemo(() => createMockReportDocumentReviewService(), []);
  const target = reportDocumentReviewNavigationState.target;
  const [status, setStatus] = useState<ReportDocumentReviewStatus>("LOADING");
  const [fields, setFields] = useState<ReportDocumentField[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<ReportDocumentFieldKey | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    if (!target || !activeCase) return;
    void Promise.all([service.getReview(target.sessionId), service.getPhoto(target.sessionId)]).then(([review, photo]) => {
      if (requestId !== requestIdRef.current) return;
      setFields(review.fields);
      setStatus(review.status);
      setPhotoUri(photo.uri);
    }).catch((error) => {
      if (requestId !== requestIdRef.current) return;
      setStatus("FAILED");
      setErrorMessage(error instanceof ReportDocumentReviewError ? "문서 정보를 확인하지 못했습니다. 다시 촬영하거나 직접 입력해 주세요." : "문서 확인을 준비하지 못했습니다.");
    });
    return () => { requestIdRef.current += 1; };
  }, [activeCase, service, target]);

  function finish(destination?: Href) {
    requestIdRef.current += 1;
    if (target) service.clearSession(target.sessionId);
    reportDocumentReviewNavigationState.clearTarget();
    destination ? router.replace(destination) : router.back();
  }

  if (!activeCase || !target) {
    return <AppScreen footer={<Button title="서류함으로 돌아가기" onPress={() => router.replace("/case/documents" as Href)} />} scroll={false}><ErrorState message={!activeCase ? "활성 사건이 없습니다." : "문서 확인 경로를 찾을 수 없습니다."} /></AppScreen>;
  }

  function editField(key: ReportDocumentFieldKey, value: string) {
    setFields((current) => current.map((field) => field.key === key ? { ...field, value } : field));
  }

  async function saveField(key: ReportDocumentFieldKey) {
    const currentTarget = reportDocumentReviewNavigationState.target;
    if (!currentTarget) return;
    const field = fields.find((item) => item.key === key);
    if (!field || !field.value.trim()) {
      setFieldError("필수 정보를 입력해 주세요.");
      return;
    }
    setFieldError(null);
    const updated = await service.updateField(currentTarget.sessionId, key, field.value);
    setFields(updated.fields);
    setStatus(hasRequiredReviewFields(updated.fields) ? "READY_FOR_DOCUMENTS" : "REVIEW_REQUIRED");
    setEditingField(null);
  }

  return <ReportDocumentReviewView photoUri={photoUri} reviewStatus={status} fields={fields} editingField={editingField} errorMessage={errorMessage} fieldError={fieldError} onBack={() => finish()} onEditField={(key) => { setFieldError(null); setEditingField(key); }} onChangeField={editField} onSaveField={(key) => void saveField(key)} onCancelField={() => { setFieldError(null); setEditingField(null); }} onMoveToDocuments={() => finish("/case/documents" as Href)} onRetake={() => finish()} onCaseTab={() => finish("/case" as Href)} onGuideTab={() => finish("/case/guides" as Href)} onDocumentsTab={() => finish("/case/documents" as Href)} />;
}
