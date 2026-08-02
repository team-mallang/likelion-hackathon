import { z } from "zod";

export const caseAnalysisQuestionSchema = z.object({
  field: z.string().min(1),
  question: z.string().min(1),
});

export const caseAnalysisResultSchema = z.object({
  summary: z.string(),
  missingFields: z.array(z.string()),
  questions: z.array(caseAnalysisQuestionSchema),
});

export type CaseAnalysisQuestion = z.infer<
  typeof caseAnalysisQuestionSchema
>;
export type CaseAnalysisResult = z.infer<typeof caseAnalysisResultSchema>;
