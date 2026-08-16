import * as MailComposer from "expo-mail-composer";
import { Directory, File } from "expo-file-system";
import { Platform } from "react-native";

import type { PreparedCaseExport } from "./exportCasePackage";
import { emailBody, emailSubject, isValidExportEmail } from "./exportDeliveryModel";

export async function sendPreparedCaseExportByEmail(prepared: PreparedCaseExport, recipient: string) {
  if (!isValidExportEmail(recipient)) throw new Error("INVALID_EMAIL");
  if (!(await MailComposer.isAvailableAsync())) throw new Error("MAIL_UNAVAILABLE");
  return MailComposer.composeAsync({
    recipients: [recipient.trim()],
    subject: emailSubject(prepared.caseNumber),
    body: emailBody(prepared.caseNumber),
    attachments: [prepared.zipUri],
  });
}

export async function savePreparedCaseExportToFolder(prepared: PreparedCaseExport) {
  if (Platform.OS !== "android") throw new Error("FOLDER_EXPORT_UNAVAILABLE");
  if (typeof Directory.pickDirectoryAsync !== "function") throw new Error("FOLDER_EXPORT_UNAVAILABLE");
  const selected = await Directory.pickDirectoryAsync();
  const caseDirectory = new Directory(selected.uri, `CASE-${prepared.caseNumber.replace(/[^A-Za-z0-9_-]/g, "_")}`);
  caseDirectory.create({ idempotent: true, intermediates: true });
  const attachments = new Directory(caseDirectory, "attachments");
  attachments.create({ idempotent: true, intermediates: true });
  const copy = (sourceUri: string, directory: Directory, fileName: string) => {
    const source = new File(sourceUri);
    if (!source.exists) throw new Error("EXPORT_SOURCE_MISSING");
    const destination = new File(directory, fileName);
    if (destination.exists) destination.delete();
    source.copy(destination);
  };
  copy(prepared.files.caseCardPdfUri, caseDirectory, "case-card.pdf");
  copy(prepared.files.policeReportPdfUri, caseDirectory, "police-report-draft.pdf");
  for (const item of prepared.files.evidence) copy(item.uri, attachments, item.fileName);
}
