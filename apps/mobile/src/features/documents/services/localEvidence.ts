import { Directory, File, Paths } from "expo-file-system";
import { parseEvidenceIndex, type EvidenceIndex, isEvidence, type LocalEvidence } from "./localEvidenceModel";

export type { LocalEvidence } from "./localEvidenceModel";

const evidenceRoot = new Directory(Paths.document, "evidence");
let operation = Promise.resolve();

function safePathPart(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "case";
}

function caseDirectory(caseId: string) {
  return new Directory(evidenceRoot, safePathPart(caseId));
}

function indexFile(caseId: string) {
  return new File(caseDirectory(caseId), "index.json");
}

function ensureCaseDirectory(caseId: string) {
  const directory = caseDirectory(caseId);
  directory.create({ idempotent: true, intermediates: true });
  return directory;
}

function readIndex(caseId: string): EvidenceIndex {
  const file = indexFile(caseId);
  if (!file.exists) return { version: 1, items: [] };
  try {
    return parseEvidenceIndex(file.textSync());
  } catch {
    return { version: 1, items: [] };
  }
}

function writeIndex(caseId: string, items: LocalEvidence[]) {
  ensureCaseDirectory(caseId);
  const file = indexFile(caseId);
  if (!file.exists) file.create({ intermediates: true });
  file.write(JSON.stringify({ version: 1, items } satisfies EvidenceIndex));
}

function queue<T>(work: () => T | Promise<T>): Promise<T> {
  const next = operation.then(work, work);
  operation = next.then(() => undefined, () => undefined);
  return next;
}

export function saveLocalEvidence(
  caseId: string,
  sourceUri: string,
  metadata: { documentType?: string; fileName?: string; mimeType?: string } = {},
): Promise<LocalEvidence> {
  return queue(() => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const fileName = metadata.fileName?.replace(/[^a-zA-Z0-9._-]/g, "_") || `${id}.jpg`;
    const destination = new File(ensureCaseDirectory(caseId), `${id}-${fileName}`);
    new File(sourceUri).copy(destination);
    const evidence: LocalEvidence = {
      id,
      caseId,
      uri: destination.uri,
      documentType: metadata.documentType ?? "경찰 발급 서류",
      createdAt: new Date().toISOString(),
      fileName: destination.name,
      mimeType: metadata.mimeType ?? "image/jpeg",
    };
    writeIndex(caseId, [evidence, ...readIndex(caseId).items]);
    return evidence;
  });
}

export function listLocalEvidence(caseId: string): Promise<LocalEvidence[]> {
  return queue(() => {
    const index = readIndex(caseId);
    const valid = index.items.filter((item) => item.caseId === caseId && new File(item.uri).exists);
    if (valid.length !== index.items.length) writeIndex(caseId, valid);
    return valid;
  });
}

export function removeLocalEvidence(caseId: string, evidenceId: string): Promise<void> {
  return queue(() => {
    const items = readIndex(caseId).items;
    const target = items.find((item) => item.id === evidenceId);
    if (target) {
      const file = new File(target.uri);
      if (file.exists) file.delete();
    }
    writeIndex(caseId, items.filter((item) => item.id !== evidenceId));
  });
}

export function clearLocalEvidence(caseId: string): Promise<void> {
  return queue(() => {
    const directory = caseDirectory(caseId);
    if (directory.exists) directory.delete();
  });
}
