import { Directory, File, Paths } from "expo-file-system";
import { zip } from "react-native-zip-archive";

import { attachmentFileName, sanitizeExportName } from "./exportArchiveModel";

export type ExportEvidenceFile = { uri: string; fileName: string; mimeType: string };

export type ExportWorkspace = {
  root: Directory;
  caseDirectory: Directory;
  zipFile: File;
};

export function createExportWorkspace(caseNumber: string): ExportWorkspace {
  const exportId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const root = new Directory(Paths.cache, "exports", exportId);
  const safeCaseNumber = `CASE-${sanitizeExportName(caseNumber)}`;
  const caseDirectory = new Directory(root, safeCaseNumber);
  const zipFile = new File(Paths.cache, "exports", `${exportId}-${safeCaseNumber}.zip`);
  root.create({ idempotent: true, intermediates: true });
  caseDirectory.create({ idempotent: true, intermediates: true });
  return { root, caseDirectory, zipFile };
}

export function copyExportFile(sourceUri: string, destination: File) {
  const source = new File(sourceUri);
  if (!source.exists) throw new Error("EXPORT_SOURCE_MISSING");
  destination.parentDirectory.create({ idempotent: true, intermediates: true });
  source.copy(destination);
}

export function copyEvidenceFiles(evidence: ExportEvidenceFile[], attachmentsDirectory: Directory) {
  attachmentsDirectory.create({ idempotent: true, intermediates: true });
  return evidence.map((item, index) => {
    const destination = new File(attachmentsDirectory, attachmentFileName(index + 1, item.fileName, item.mimeType));
    copyExportFile(item.uri, destination);
    return destination;
  });
}

export async function zipExportFolder(exportRoot: Directory, zipFile: File) {
  if (zipFile.exists) zipFile.delete();
  await zip(exportRoot.uri, zipFile.uri);
  return zipFile.uri;
}

export function cleanupExportWorkspace(root: Directory, zipFile?: File) {
  if (root.exists) root.delete();
  if (zipFile?.exists) zipFile.delete();
}
