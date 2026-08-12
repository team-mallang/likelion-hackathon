import { z } from "zod";

export const inspectedDocumentTypeSchema = z.enum([
  "POLICE_REPORT", "RECEIPT", "INSURANCE", "OTHER", "UNKNOWN",
]);
export const documentImportantFieldTypeSchema = z.enum([
  "DATE", "ISSUER", "CASE_NUMBER", "OTHER",
]);
export const documentInspectionSchema = z.object({
  usable: z.boolean(),
  documentType: inspectedDocumentTypeSchema,
  quality: z.object({ readable: z.boolean(), fullyVisible: z.boolean(), blurDetected: z.boolean(), glareDetected: z.boolean() }),
  importantFields: z.array(z.object({ type: documentImportantFieldTypeSchema, detected: z.boolean(), readable: z.boolean() })).max(8),
  issues: z.array(z.string().min(1).max(300)).max(8),
  recommendation: z.string().min(1).max(300).nullable(),
});
export const documentInspectionSuccessResponseSchema = z.object({
  success: z.literal(true), data: documentInspectionSchema,
  meta: z.object({ provider: z.literal("openai"), model: z.string().min(1), fallback: z.literal(false) }),
});
export type DocumentInspection = z.infer<typeof documentInspectionSchema>;
