import {
  ReportDocumentReviewError,
  type ReportDocumentReviewService,
} from "@/features/report-document-review/services/reportDocumentReview";
import type {
  ReportDocumentField,
  ReportDocumentReviewSession,
} from "@/features/report-document-review/types/reportDocumentReview";
import type { ReportDocumentReviewAnalyzer } from "./reportDocumentReview";

const defaultFields: ReportDocumentField[] = [
  { key: "incidentNumber", label: "접수 번호 (Incident Number)", value: "JPD-2023-1104A", confidence: "HIGH", editable: true, required: true },
  { key: "occurredAt", label: "발생 일시 (Date)", value: "2023. 11. 24. 14:30", confidence: "MEDIUM", editable: true, required: true },
  { key: "policeStation", label: "관할서 (Police Station)", value: "Shibuya Police Station", confidence: "HIGH", editable: true, required: true },
];

type StoredSession = ReportDocumentReviewSession & { photoUri: string };
let sequence = 0;
const sessions = new Map<string, StoredSession>();

export function createMockReportDocumentReviewAnalyzer(options?: { fields?: ReportDocumentField[]; fail?: boolean }): ReportDocumentReviewAnalyzer {
  return {
    async analyze(photo) {
      if (!photo.uri || options?.fail) throw new ReportDocumentReviewError("REVIEW_FAILED", "문서 정보를 확인하지 못했습니다.");
      return (options?.fields ?? defaultFields).map((field) => ({ ...field }));
    },
  };
}

function clone(session: StoredSession): ReportDocumentReviewSession {
  return {
    sessionId: session.sessionId,
    source: session.source,
    status: session.status,
    fields: session.fields.map((field) => ({ ...field })),
    photoAvailable: session.photoAvailable,
  };
}

export function createMockReportDocumentReviewService(options?: {
  fail?: boolean;
  fields?: ReportDocumentField[];
}): ReportDocumentReviewService {
  const analyzer = createMockReportDocumentReviewAnalyzer(options);
  return {
    async createSession({ source, photo }) {
      if (!photo.uri) throw new ReportDocumentReviewError("PHOTO_NOT_AVAILABLE", "문서 사진을 확인할 수 없습니다.");
      const sessionId = `mock-review-${++sequence}`;
      let fields: ReportDocumentField[];
      let status: StoredSession["status"] = "REVIEW_REQUIRED";
      try {
        fields = await analyzer.analyze(photo);
      } catch {
        fields = (options?.fields ?? defaultFields).map((field) => ({ ...field }));
        status = "FAILED";
      }
      sessions.set(sessionId, {
        sessionId,
        source,
        status,
        fields,
        photoAvailable: true,
        photoUri: photo.uri,
      });
      return { sessionId };
    },
    async getReview(sessionId) {
      const session = sessions.get(sessionId);
      if (!session) throw new ReportDocumentReviewError("SESSION_NOT_FOUND", "문서 확인 세션을 찾을 수 없습니다.");
      if (session.status === "FAILED") throw new ReportDocumentReviewError("REVIEW_FAILED", "문서 정보를 확인하지 못했습니다.");
      return clone(session);
    },
    async getPhoto(sessionId) {
      const session = sessions.get(sessionId);
      if (!session || !session.photoUri) throw new ReportDocumentReviewError("PHOTO_NOT_AVAILABLE", "문서 사진을 확인할 수 없습니다.");
      return { uri: session.photoUri };
    },
    async updateField(sessionId, key, value) {
      const session = sessions.get(sessionId);
      if (!session) throw new ReportDocumentReviewError("SESSION_NOT_FOUND", "문서 확인 세션을 찾을 수 없습니다.");
      session.fields = session.fields.map((field) => field.key === key ? { ...field, value } : field);
      session.status = session.fields.every((field) => !field.required || field.value.trim()) ? "READY_FOR_DOCUMENTS" : "REVIEW_REQUIRED";
      return clone(session);
    },
    clearSession(sessionId) {
      sessions.delete(sessionId);
    },
  };
}
