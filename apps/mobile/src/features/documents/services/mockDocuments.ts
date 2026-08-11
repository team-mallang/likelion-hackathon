import {
  DocumentsServiceError,
  type DocumentsService,
} from "@/features/documents/services/documents";
import type {
  EvidenceFile,
  GeneratedDocument,
} from "@/features/documents/types/documents";

export type MockDocumentsOptions = {
  delayMs?: number;
  failRequest?: boolean;
  emptyDocuments?: boolean;
  emptyEvidence?: boolean;
  generatingPoliceReport?: boolean;
};

const DEFAULT_DELAY_MS = 300;

const generatedDocuments: GeneratedDocument[] = [
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

const evidenceFiles: EvidenceFile[] = [
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

function wait(delayMs: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.max(0, delayMs));
  });
}

export function createMockDocumentsService(
  caseNumber: string,
  options: MockDocumentsOptions = {},
): DocumentsService {
  return {
    async getOverview(caseId) {
      await wait(options.delayMs ?? DEFAULT_DELAY_MS);

      if (!caseId.trim()) {
        throw new DocumentsServiceError(
          "INVALID_CASE_ID",
          "조회할 활성 사건이 없습니다.",
        );
      }

      if (options.failRequest) {
        throw new DocumentsServiceError(
          "FETCH_FAILED",
          "서류 정보를 불러오지 못했습니다.",
        );
      }

      return {
        caseId,
        caseNumber,
        reportStatusLabel: "신고 완료",
        progressPercent: 80,
        documents: options.emptyDocuments
          ? []
          : generatedDocuments.map((document) => ({
              ...document,
              status:
                options.generatingPoliceReport &&
                document.kind === "POLICE_REPORT_DRAFT"
                  ? "GENERATING"
                  : document.status,
            })),
        evidenceFiles: options.emptyEvidence
          ? []
          : evidenceFiles.map((evidence) => ({ ...evidence })),
      };
    },
  };
}
