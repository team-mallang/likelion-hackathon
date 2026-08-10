import { z } from "zod";

export const countryCodeSchema = z
  .string()
  .regex(/^[A-Z]{2}$/, "국가코드는 대문자 영문 2자리여야 합니다.");

export const generatedCaseNumberSchema = z.string().regex(
  /^[A-Z]{2}\d{4}[A-Z0-9]{4}$/,
  "사건번호 형식이 올바르지 않습니다.",
);

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

export const caseInputItemSchema = caseItemSchema.extend({
  category: caseItemSchema.shape.category.unwrap().nullable().optional(),
  brand: caseItemSchema.shape.brand.unwrap().nullable().optional(),
  model: caseItemSchema.shape.model.unwrap().nullable().optional(),
  color: caseItemSchema.shape.color.unwrap().nullable().optional(),
  description:
    caseItemSchema.shape.description.unwrap().nullable().optional(),
  identifyingFeature:
    caseItemSchema.shape.identifyingFeature.unwrap().nullable().optional(),
  lastSeenAt:
    caseItemSchema.shape.lastSeenAt.unwrap().nullable().optional(),
  lastSeenPlace:
    caseItemSchema.shape.lastSeenPlace.unwrap().nullable().optional(),
});

export const caseAnalysisAnswerValueSchema = z.union([
  z.string().min(1),
  z.number().finite(),
  z.boolean(),
  z.array(z.string().min(1)).min(1),
]);

export const caseAnalysisAnswerSchema = z.object({
  field: z.string().min(1),
  value: caseAnalysisAnswerValueSchema,
});

export const createCaseSchema = z.object({
  initialStatement: z.string().min(1, "사건 설명은 필수입니다."),
  countryCode: countryCodeSchema,

  type: caseTypeSchema.default("UNKNOWN"),

  lastSeenAt: z.iso.datetime().optional(),
  lastSeenPlace: z.string().optional(),

  discoveredAt: z.iso.datetime().optional(),
  discoveredPlace: z.string().optional(),

  items: z.array(caseItemSchema).default([]),
});

export const analyzeCaseInputSchema = createCaseSchema.extend({
  lastSeenAt: z.iso.datetime().nullable().optional(),
  lastSeenPlace: z.string().nullable().optional(),

  discoveredAt: z.iso.datetime().nullable().optional(),
  discoveredPlace: z.string().nullable().optional(),

  description: z.string().nullable().optional(),
  items: z.array(caseInputItemSchema).default([]),
  answers: z.array(caseAnalysisAnswerSchema).default([]),
});

export const casePasswordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다.")
  .max(72, "비밀번호는 72자 이하여야 합니다.");

export const createConfirmedCaseSchema = analyzeCaseInputSchema
  .omit({ answers: true })
  .extend({
    password: casePasswordSchema,
    aiSummary: z.string().nullable().optional(),
    missingFields: z.array(z.string()).nullable().optional(),
    items: z.array(caseInputItemSchema).min(1),
  });

export const confirmedCaseItemResponseSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  name: z.string(),
  category: z.string().nullable(),
  quantity: z.number().int(),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  color: z.string().nullable(),
  description: z.string().nullable(),
  identifyingFeature: z.string().nullable(),
  lastSeenAt: z.iso.datetime().nullable(),
  lastSeenPlace: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const confirmedCaseResponseSchema = z.object({
  id: z.string(),
  caseNumber: generatedCaseNumberSchema,
  type: caseTypeSchema,
  status: z.literal("CONFIRMED"),
  countryCode: countryCodeSchema,
  initialStatement: z.string(),
  lastSeenAt: z.iso.datetime().nullable(),
  lastSeenPlace: z.string().nullable(),
  discoveredAt: z.iso.datetime().nullable(),
  discoveredPlace: z.string().nullable(),
  description: z.string().nullable(),
  aiSummary: z.string().nullable(),
  missingFields: z.array(z.string()).nullable(),
  retentionUntil: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  items: z.array(confirmedCaseItemResponseSchema),
});

export const createConfirmedCaseSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    caseId: z.string(),
    case: confirmedCaseResponseSchema,
  }),
});

export const updateCaseSchema = z.object({
  type: caseTypeSchema.optional(),
  countryCode: countryCodeSchema.optional(),

  lastSeenAt: z.iso.datetime().nullable().optional(),
  lastSeenPlace: z.string().nullable().optional(),

  discoveredAt: z.iso.datetime().nullable().optional(),
  discoveredPlace: z.string().nullable().optional(),

  description: z.string().nullable().optional(),
  aiSummary: z.string().nullable().optional(),
  missingFields: z.array(z.string()).nullable().optional(),
});

// 사건 확정 시 사용자가 직접 입력하는 비밀번호 검증
export const confirmCaseSchema = z.object({
  password: casePasswordSchema,
});

export type ConfirmCaseInput = z.infer<typeof confirmCaseSchema>;

// 사건번호와 비밀번호를 이용한 인증 요청 검증
export const authenticateCaseSchema = z.object({
  caseNumber: z.string().min(1, "사건번호를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type CaseType = z.infer<typeof caseTypeSchema>;
export type CaseItemInput = z.infer<typeof caseItemSchema>;
export type CaseInputItem = z.infer<typeof caseInputItemSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type AnalyzeCaseInput = z.infer<typeof analyzeCaseInputSchema>;
export type CaseAnalysisAnswer = z.infer<typeof caseAnalysisAnswerSchema>;
export type CreateConfirmedCaseInput = z.infer<
  typeof createConfirmedCaseSchema
>;
export type CreateConfirmedCaseSuccessResponse = z.infer<
  typeof createConfirmedCaseSuccessResponseSchema
>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type AuthenticateCaseInput = z.infer<typeof authenticateCaseSchema>;
