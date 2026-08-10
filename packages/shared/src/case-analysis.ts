import { z } from "zod";

import { caseItemSchema } from "./case";

export const caseAnalysisItemSchema = caseItemSchema.pick({
  name: true,
}).extend({
  category: caseItemSchema.shape.category.unwrap().nullable(),
  quantity: caseItemSchema.shape.quantity.unwrap(),
  brand: caseItemSchema.shape.brand.unwrap().nullable(),
  model: caseItemSchema.shape.model.unwrap().nullable(),
  color: caseItemSchema.shape.color.unwrap().nullable(),
  description: caseItemSchema.shape.description.unwrap().nullable(),
  identifyingFeature:
    caseItemSchema.shape.identifyingFeature.unwrap().nullable(),
  lastSeenAt: caseItemSchema.shape.lastSeenAt.unwrap().nullable(),
  lastSeenPlace: caseItemSchema.shape.lastSeenPlace.unwrap().nullable(),
});

export const caseAnalysisQuestionSchema = z.object({
  field: z.string().min(1),
  question: z.string().min(1),
  answerType: z.enum([
    "text",
    "number",
    "boolean",
    "date",
    "datetime",
    "select",
    "multiselect",
  ]),
  options: z.array(z.string()),
  required: z.boolean(),
  order: z.number().int().nonnegative(),
});

export const caseAnalysisResultSchema = z.object({
  summary: z.string(),
  missingFields: z.array(z.string()),
  questions: z.array(caseAnalysisQuestionSchema),
  items: z.array(caseAnalysisItemSchema),
});

export const caseAnalysisSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: caseAnalysisResultSchema,
  meta: z.object({
    provider: z.enum(["mock", "openai"]),
    model: z.string().nullable(),
    fallback: z
      .object({
        from: z.literal("openai"),
        reason: z.enum(["INVALID_RESPONSE", "PROVIDER_ERROR"]),
      })
      .optional(),
  }),
});

export type CaseAnalysisQuestion = z.infer<
  typeof caseAnalysisQuestionSchema
>;
export type CaseAnalysisItem = z.infer<typeof caseAnalysisItemSchema>;
export type CaseAnalysisResult = z.infer<typeof caseAnalysisResultSchema>;
export type CaseAnalysisSuccessResponse = z.infer<
  typeof caseAnalysisSuccessResponseSchema
>;
