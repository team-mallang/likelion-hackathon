import * as Print from "expo-print";
import { File } from "expo-file-system";

import type { PreviousCaseCard } from "@/features/case-card/types/caseCard";
import type { PoliceReportDraft } from "@/features/police-report/types/policeReport";
import { buildCaseCardHtml, buildPoliceReportHtml } from "./exportPdf";

export async function generatePoliceReportPdf(draft: PoliceReportDraft): Promise<string> {
  const result = await Print.printToFileAsync({ html: buildPoliceReportHtml(draft) });
  return result.uri;
}

export async function generateCaseCardPdf(caseCard: PreviousCaseCard): Promise<string> {
  const result = await Print.printToFileAsync({ html: buildCaseCardHtml(caseCard) });
  return result.uri;
}

export function cleanupGeneratedPdf(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Cleanup is best effort and must never mask the export result.
  }
}
