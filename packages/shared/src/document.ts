import { z } from "zod";

export const documentTypeSchema = z.enum([
  "POLICE_REPORT",
  "EMBASSY_OR_CONSULAR",
  "INSURANCE",
  "RECEIPT",
  "OTHER_EVIDENCE",
]);

export const documentStatusSchema = z.enum([
  "ANALYZED",
  "NEEDS_REVIEW",
  "CONFIRMED",
]);

export const documentCreationStatusSchema = z.enum([
  "ANALYZED",
  "NEEDS_REVIEW",
]);

export const documentDateSchema = z.union([
  z.iso.date(),
  z.iso.datetime(),
]);

export const documentExtractedFieldSchema = z.enum([
  "documentTitle",
  "issuingOrganization",
  "issuedAt",
  "referenceNumber",
  "reportNumber",
  "itemDescription",
  "amount",
  "currency",
  "purchaseDate",
  "purchasePlace",
  "notes",
]);

export const documentExtractedDataSchema = z
  .object({
    documentTitle: z.string().nullable().optional(),
    issuingOrganization: z.string().nullable().optional(),
    issuedAt: documentDateSchema.nullable().optional(),
    referenceNumber: z.string().nullable().optional(),
    reportNumber: z.string().nullable().optional(),
    itemDescription: z.string().nullable().optional(),
    amount: z.number().nonnegative().nullable().optional(),
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .nullable()
      .optional(),
    purchaseDate: documentDateSchema.nullable().optional(),
    purchasePlace: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
  })
  .strict();

export const documentMissingFieldSchema = z.object({
  field: documentExtractedFieldSchema,
  reason: z.string().optional(),
});

export const createDocumentSchema = z
  .object({
    type: documentTypeSchema,
    status: documentCreationStatusSchema.default("ANALYZED"),
    analysisSummary: z.string().nullable().optional(),
    extractedData: documentExtractedDataSchema.nullable().optional(),
    missingFields: z.array(documentMissingFieldSchema).default([]),
    analyzedAt: z.iso.datetime().nullable().optional(),
  })
  .strict();

export const confirmDocumentSchema = z
  .object({
    status: z.literal("CONFIRMED"),
  })
  .strict();

export const documentSchema = z.object({
  id: z.string(),
  caseId: z.string(),
  type: documentTypeSchema,
  status: documentStatusSchema,
  analysisSummary: z.string().nullable(),
  extractedData: documentExtractedDataSchema.nullable(),
  missingFields: z.array(documentMissingFieldSchema).nullable(),
  analyzedAt: z.iso.datetime().nullable(),
  confirmedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const documentSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    document: documentSchema,
  }),
});

export const documentListSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    documents: z.array(documentSchema),
  }),
});

export type DocumentType = z.infer<typeof documentTypeSchema>;
export type DocumentStatus = z.infer<typeof documentStatusSchema>;
export type DocumentCreationStatus = z.infer<
  typeof documentCreationStatusSchema
>;
export type DocumentDate = z.infer<typeof documentDateSchema>;
export type DocumentExtractedField = z.infer<
  typeof documentExtractedFieldSchema
>;
export type DocumentExtractedData = z.infer<
  typeof documentExtractedDataSchema
>;
export type DocumentMissingField = z.infer<
  typeof documentMissingFieldSchema
>;
export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type ConfirmDocumentInput = z.infer<
  typeof confirmDocumentSchema
>;
export type DocumentData = z.infer<typeof documentSchema>;
export type DocumentSuccessResponse = z.infer<
  typeof documentSuccessResponseSchema
>;
export type DocumentListSuccessResponse = z.infer<
  typeof documentListSuccessResponseSchema
>;
