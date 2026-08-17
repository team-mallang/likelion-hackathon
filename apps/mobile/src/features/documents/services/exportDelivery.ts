import * as MailComposer from "expo-mail-composer";
import * as Sharing from "expo-sharing";

import type { PreparedCaseExport } from "./exportCasePackage";
import { emailBody, emailSubject, isValidExportEmail } from "./exportDeliveryModel";

export async function sendPreparedCaseExportByEmail(prepared: PreparedCaseExport, recipient: string) {
  if (!isValidExportEmail(recipient)) throw new Error("INVALID_EMAIL");

  try {
    if (await MailComposer.isAvailableAsync()) {
      return await MailComposer.composeAsync({
        recipients: [recipient.trim()],
        subject: emailSubject(prepared.caseNumber),
        body: emailBody(prepared.caseNumber),
        attachments: [prepared.zipUri],
      });
    }
  } catch {
    // Some Android mail clients do not accept MailComposer attachments.
    // Fall through to the native share sheet with the same ZIP file.
  }

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(prepared.zipUri, {
        dialogTitle: "사건 자료 ZIP 파일 보내기",
        mimeType: "application/zip",
      });
      return;
    }
  } catch {
    // A safe user-facing error is produced by the screen below this boundary.
  }

  throw new Error("MAIL_UNAVAILABLE");
}
