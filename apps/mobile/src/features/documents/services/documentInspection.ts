import type { DocumentInspection } from "@project/shared";

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export class DocumentInspectionServiceError extends Error {
  constructor(public readonly code: "API_BASE_URL_MISSING" | "INSPECTION_FAILED") { super("문서 품질을 검사하지 못했습니다."); this.name = "DocumentInspectionServiceError"; }
}

export async function inspectDocument(uri: string, mimeType: string) {
  if (!BASE_URL) throw new DocumentInspectionServiceError("API_BASE_URL_MISSING");
  const formData = new FormData();
  formData.append("image", { uri, type: mimeType, name: "document-image" } as never);
  const response = await fetch(`${BASE_URL}/api/documents/inspect`, { method: "POST", body: formData });
  const body = await response.json().catch(() => null) as { success?: boolean; data?: DocumentInspection } | null;
  if (!response.ok || !body?.success || !body.data) throw new DocumentInspectionServiceError("INSPECTION_FAILED");
  return body.data;
}
