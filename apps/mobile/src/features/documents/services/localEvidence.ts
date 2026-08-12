import { Directory, File, Paths } from "expo-file-system";

export type LocalEvidence = { id: string; uri: string; documentType: string; createdAt: string };
const directory = new Directory(Paths.document, "submission-evidence");
const indexFile = new File(directory, "index.json");

function ensureDirectory() { if (!directory.exists) directory.create({ idempotent: true, intermediates: true }); }
function readIndex(): LocalEvidence[] { ensureDirectory(); if (!indexFile.exists) return []; try { return JSON.parse(indexFile.textSync()) as LocalEvidence[]; } catch { return []; } }
function writeIndex(entries: LocalEvidence[]) { ensureDirectory(); indexFile.write(JSON.stringify(entries)); }
function extensionFor(mimeType: string) { return mimeType === "image/png" ? "png" : mimeType === "image/webp" ? "webp" : "jpg"; }

export function persistEvidence(cacheUri: string, documentType: string, mimeType: string): LocalEvidence {
  ensureDirectory();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const destination = new File(directory, `${id}.${extensionFor(mimeType)}`);
  const source = new File(cacheUri);
  source.copy(destination);
  if (source.exists) source.delete();
  const evidence = { id, uri: destination.uri, documentType, createdAt: new Date().toISOString() };
  writeIndex([evidence, ...readIndex()]);
  return evidence;
}

export function listLocalEvidence() { return readIndex(); }
export function deleteTemporaryImage(uri: string | null | undefined) { if (!uri) return; try { const file = new File(uri); if (file.exists) file.delete(); } catch {} }
