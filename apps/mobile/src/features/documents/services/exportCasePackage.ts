import { Directory, File } from "expo-file-system";

import { previousCaseCardService } from "@/features/case-card/services/caseCard";
import { listLocalEvidence } from "./localEvidence";
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
    evidence: Array<{ uri: string; fileName: string; mimeType: string }>;
  };
  included: { policeReport: boolean; caseCard: boolean; evidenceCount: number };
  cleanup: () => void;
};

export async function prepareCaseExportPackage(input: {
  caseId: string;
  caseNumber: string;
  accessToken: string;
}): Promise<PreparedCaseExport> {
  const workspace = createExportWorkspace(input.caseNumber);
  try {
    const [caseCard, draft, evidence] = await Promise.all([
      previousCaseCardService.get(input.caseId, input.accessToken),
      createApiPoliceReportService().getOrCreateDraft({ caseId: input.caseId, accessToken: input.accessToken }),
      listLocalEvidence(input.caseId),
    ]);
    const [caseCardPdf, policeReportPdf] = await Promise.all([
      generateCaseCardPdf(caseCard),
      generatePoliceReportPdf(draft),
    ]);
    const caseCardFile = new File(workspace.caseDirectory, "case-card.pdf");
    const policeReportFile = new File(workspace.caseDirectory, "police-report-draft.pdf");
    copyExportFile(caseCardPdf, caseCardFile);
    copyExportFile(policeReportPdf, policeReportFile);
    const evidenceFiles = copyEvidenceFiles(evidence, new Directory(workspace.caseDirectory, "attachments"));
    const zipUri = await zipExportFolder(workspace.root, workspace.zipFile);
    return {
      zipUri,
      caseNumber: input.caseNumber,
      rootDirectoryUri: workspace.caseDirectory.uri,
      files: {
        caseCardPdfUri: caseCardFile.uri,
        policeReportPdfUri: policeReportFile.uri,
        evidence: evidenceFiles.map((file, index) => ({
          uri: file.uri,
          fileName: file.name,
          mimeType: evidence[index]?.mimeType ?? "image/jpeg",
        })),
      },
      included: { policeReport: true, caseCard: true, evidenceCount: evidence.length },
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
