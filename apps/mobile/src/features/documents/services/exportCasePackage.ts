import { Directory, File } from "expo-file-system";

import { previousCaseCardService } from "@/features/case-card/services/caseCard";
import { createApiPoliceReportService } from "@/features/police-report/services/apiPoliceReport";
import { generateCaseCardPdf, generatePoliceReportPdf } from "./exportPdfNative";
import {
  cleanupExportWorkspace,
  copyEvidenceFiles,
  copyExportFile,
  createExportWorkspace,
  zipExportFolder,
} from "./exportArchive";

export type PreparedCaseExport = {
  zipUri: string;
  caseNumber: string;
  rootDirectoryUri: string;
  files: {
    caseCardPdfUri: string;
    policeReportPdfUri: string;
    policeReportKoreanPdfUri: string;
    evidence: Array<{ uri: string; fileName: string; mimeType: string }>;
  };
  included: {
    policeReport: boolean;
    policeReportKorean: boolean;
    caseCard: boolean;
    evidenceCount: number;
  };
  cleanup: () => void;
};

export async function prepareCaseExportPackage(input: {
  caseId: string;
  caseNumber: string;
  accessToken: string;
  evidence?: Array<{ id: string; uri: string; mimeType?: string; createdAt: number }>;
}): Promise<PreparedCaseExport> {
  const workspace = createExportWorkspace(input.caseNumber);
  try {
    const [caseCard, draft] = await Promise.all([
      previousCaseCardService.get(input.caseId, input.accessToken),
      createApiPoliceReportService().getOrCreateDraft({ caseId: input.caseId, accessToken: input.accessToken }),
    ]);
    const evidence = input.evidence ?? [];
    const [caseCardPdf, policeReportPdf, policeReportKoreanPdf] = await Promise.all([
      generateCaseCardPdf(caseCard),
      generatePoliceReportPdf(draft, "ja"),
      generatePoliceReportPdf(draft, "ko"),
    ]);
    const caseCardFile = new File(workspace.caseDirectory, "case-card.pdf");
    const policeReportFile = new File(workspace.caseDirectory, "police-report-draft.pdf");
    const policeReportKoreanFile = new File(
      workspace.caseDirectory,
      "police-report-korean-reference.pdf",
    );
    copyExportFile(caseCardPdf, caseCardFile);
    copyExportFile(policeReportPdf, policeReportFile);
    copyExportFile(policeReportKoreanPdf, policeReportKoreanFile);
    const evidenceFiles = copyEvidenceFiles(evidence.map((item, index) => ({
      uri: item.uri,
      fileName: `evidence-${String(index + 1).padStart(3, "0")}`,
      mimeType: item.mimeType ?? "image/jpeg",
    })), new Directory(workspace.caseDirectory, "attachments"));
    const zipUri = await zipExportFolder(workspace.root, workspace.zipFile);
    return {
      zipUri,
      caseNumber: input.caseNumber,
      rootDirectoryUri: workspace.caseDirectory.uri,
      files: {
        caseCardPdfUri: caseCardFile.uri,
        policeReportPdfUri: policeReportFile.uri,
        policeReportKoreanPdfUri: policeReportKoreanFile.uri,
        evidence: evidenceFiles.map((file, index) => ({
          uri: file.uri,
          fileName: file.name,
          mimeType: evidence[index]?.mimeType ?? "image/jpeg",
        })),
      },
      included: {
        policeReport: true,
        policeReportKorean: true,
        caseCard: true,
        evidenceCount: evidence.length,
      },
      cleanup: () => cleanupExportWorkspace(workspace.root, workspace.zipFile),
    };
  } catch (error) {
    cleanupExportWorkspace(workspace.root, workspace.zipFile);
    throw error;
  }
}

export function cleanupPreparedCaseExport(prepared: PreparedCaseExport) {
  prepared.cleanup();
}

export function schedulePreparedCaseExportCleanup(
  prepared: PreparedCaseExport,
  delayMs = 15 * 60 * 1000,
) {
  setTimeout(() => prepared.cleanup(), delayMs);
}
