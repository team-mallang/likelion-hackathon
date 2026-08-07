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
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상이어야 합니다.")
    .max(72, "비밀번호는 72자 이하여야 합니다."),
});

export type ConfirmCaseInput = z.infer<typeof confirmCaseSchema>;

// 사건번호와 비밀번호를 이용한 인증 요청 검증
export const authenticateCaseSchema = z.object({
  caseNumber: z.string().min(1, "사건번호를 입력해주세요."),
  password: z.string().min(1, "비밀번호를 입력해주세요."),
});

export type CaseType = z.infer<typeof caseTypeSchema>;
export type CaseItemInput = z.infer<typeof caseItemSchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type AuthenticateCaseInput = z.infer<typeof authenticateCaseSchema>;
