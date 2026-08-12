import { zodTextFormat } from "openai/helpers/zod";
import { ZodError } from "zod";

import { documentInspectionSchema, type DocumentInspection } from "@project/shared";

import { getOpenAIClient, getOpenAIModel } from "./client";

export class DocumentInspectionError extends Error {
  constructor(options?: ErrorOptions) { super("OpenAI document inspection failed.", options); this.name = "DocumentInspectionError"; }
}

const INSTRUCTIONS = [
  "Assess whether this photographed document is suitable to keep as a submission copy for police, insurance, or evidence use.",
  "Do not transcribe, return, infer, or retain personal data or full document contents.",
  "Set usable true only when the document is a real document, fully visible, sufficiently large, readable, and not materially obscured by blur, glare, or shadow.",
  "Important fields mean only visibly present fields such as a date, issuer, case/reference number, or another meaningful document identifier. Do not fail a document merely because a particular field type is absent.",
  "If it is blank, unrelated, cropped, too small, or unreadable, set usable false and give concise Korean issues and a Korean recommendation for re-capture.",
  "Return only the requested structured output.",
].join("\n");

export async function inspectDocumentImage(input: { mimeType: string; bytes: Uint8Array }) : Promise<DocumentInspection> {
  try {
    const dataUrl = `data:${input.mimeType};base64,${Buffer.from(input.bytes).toString("base64")}`;
    const response = await getOpenAIClient().responses.parse({
      model: getOpenAIModel(),
      instructions: INSTRUCTIONS,
      input: [{ role: "user", content: [
        { type: "input_text", text: "Inspect this image for submission quality only." },
        { type: "input_image", image_url: dataUrl, detail: "high" },
      ] }],
      text: { format: zodTextFormat(documentInspectionSchema, "document_inspection") },
    });
    const parsed = documentInspectionSchema.safeParse(response.output_parsed);
    if (!parsed.success) throw new DocumentInspectionError();
    return parsed.data;
  } catch (error) {
    if (error instanceof DocumentInspectionError || error instanceof ZodError) throw new DocumentInspectionError();
    throw new DocumentInspectionError({ cause: error });
  }
}
