export type LocalEvidence = {
  id: string;
  caseId: string;
  uri: string;
  documentType: string;
  createdAt: string;
  fileName: string;
  mimeType: string;
};

export type EvidenceIndex = { version: 1; items: LocalEvidence[] };

export function isEvidence(value: unknown): value is LocalEvidence {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<LocalEvidence>;
  return [item.id, item.caseId, item.uri, item.documentType, item.createdAt, item.fileName, item.mimeType]
    .every((field) => typeof field === "string" && field.length > 0);
}

export function parseEvidenceIndex(value: string): EvidenceIndex {
  try {
    const parsed = JSON.parse(value) as Partial<EvidenceIndex>;
    return parsed.version === 1 && Array.isArray(parsed.items)
      ? { version: 1, items: parsed.items.filter(isEvidence) }
      : { version: 1, items: [] };
  } catch {
    return { version: 1, items: [] };
  }
}
