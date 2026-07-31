import { z } from "zod";

export const caseTypeSchema = z.enum(["LOST", "STOLEN"]);

export const createCaseSchema = z.object({
  type: caseTypeSchema,
  occurredAt: z.iso.datetime(),
  location: z.string().min(1),
  description: z.string().min(1),
});

export type CaseType = z.infer<typeof caseTypeSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
