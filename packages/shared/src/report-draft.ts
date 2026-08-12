import { z } from "zod";

export const reportDraftFieldSourceSchema = z.enum([
  "CASE",
  "AI_DRAFT",
  "USER_REQUIRED",
]);

export const policeReportDraftFieldSchema = z.object({
  key: z.string().min(1),
  labelKo: z.string().min(1),
  labelJa: z.string().min(1),
  valueKo: z.string().nullable(),
  valueJa: z.string().nullable(),
  source: reportDraftFieldSourceSchema,
  editable: z.boolean(),
  instructionKo: z.string().min(1).optional(),
  instructionJa: z.string().min(1).optional(),
});

export const policeReportDraftSectionSchema = z.object({
  key: z.enum(["reporter", "incident", "items", "statement"]),
  titleKo: z.string().min(1),
  titleJa: z.string().min(1),
  fields: z.array(policeReportDraftFieldSchema),
});

export const policeReportDraftSchema = z.object({
  documentType: z.literal("POLICE_REPORT"),
  language: z.object({
    primary: z.literal("ja"),
    support: z.literal("ko"),
  }),
  sections: z.array(policeReportDraftSectionSchema).length(4),
});

export const policeReportDraftSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: policeReportDraftSchema,
  meta: z.object({
    provider: z.literal("openai"),
    model: z.string().min(1),
    fallback: z.literal(false),
  }),
});

export const revisePoliceReportDraftSchema = z.object({
  edits: z
    .array(
      z.object({
        key: z.string().min(1).max(100),
        valueKo: z.string().trim().max(4000).nullable(),
      }),
    )
    .min(1)
    .max(50),
});

export type PoliceReportDraft = z.infer<typeof policeReportDraftSchema>;
export type PoliceReportDraftField = z.infer<typeof policeReportDraftFieldSchema>;
export type RevisePoliceReportDraftInput = z.infer<
  typeof revisePoliceReportDraftSchema
>;
