import { z } from "zod";

export const caseTypeSchema = z.enum([
  "LOST",
  "STOLEN",
  "UNKNOWN",
]);

export const caseItemSchema = z.object({
  name: z.string().min(1, "물품 이름은 필수입니다."),
  category: z.string().optional(),
  quantity: z.number().int().positive().default(1),

  brand: z.string().optional(),
  model: z.string().optional(),
  color: z.string().optional(),
  description: z.string().optional(),
  identifyingFeature: z.string().optional(),

  lastSeenAt: z.iso.datetime().optional(),
  lastSeenPlace: z.string().optional(),
});

export const createCaseSchema = z.object({
  initialStatement: z.string().min(1, "사건 설명은 필수입니다."),

  type: caseTypeSchema.default("UNKNOWN"),

  lastSeenAt: z.iso.datetime().optional(),
  lastSeenPlace: z.string().optional(),

  discoveredAt: z.iso.datetime().optional(),
  discoveredPlace: z.string().optional(),

  items: z.array(caseItemSchema).default([]),
});

export const updateCaseSchema = z.object({
  type: caseTypeSchema.optional(),

  lastSeenAt: z.iso.datetime().nullable().optional(),
  lastSeenPlace: z.string().nullable().optional(),

  discoveredAt: z.iso.datetime().nullable().optional(),
  discoveredPlace: z.string().nullable().optional(),

  description: z.string().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
  missingFields: z.array(z.string()).nullable().optional(),
});

export type CaseType = z.infer<typeof caseTypeSchema>;
export type CaseItemInput = z.infer<typeof caseItemSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;