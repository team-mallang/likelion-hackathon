import { z } from "zod";

import { caseInputItemSchema, caseTypeSchema } from "./case";

export const guideGenerationInputSchema = z.object({
  type: caseTypeSchema,
  items: z.array(caseInputItemSchema),
});

export const guideStepDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable(),
  reason: z.string().nullable(),
  preparations: z.array(z.string()),
  institutionName: z.string().nullable(),
  contact: z.string().nullable(),
  stepOrder: z.number().int().positive(),
  priority: z.number().int().nonnegative(),
});

export const guideStepDraftListSchema = z.array(guideStepDraftSchema);

export const guideStepStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
]);

export const updateGuideStepSchema = z.object({
  status: guideStepStatusSchema,
});

export type GuideGenerationInput = z.infer<
  typeof guideGenerationInputSchema
>;
export type GuideStepDraft = z.infer<typeof guideStepDraftSchema>;
export type GuideStepStatus = z.infer<typeof guideStepStatusSchema>;
