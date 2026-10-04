import { z } from "zod";

export const evidenceTypeEnum = z.enum([
  "SCALE_IMAGE",
  "INVOICE",
  "RECEIPT",
  "CERTIFICATE",
  "MATERIAL_IMAGE",
  "DOCUMENT",
  "VIDEO",
  "OTHER",
]);

export const uploadEvidenceBodySchema = z.object({
  type: evidenceTypeEnum,
});

export const caseIdParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Case identifier is required")
    .max(100, "Invalid case identifier length"),
});

export type UploadEvidenceDto = z.infer<typeof uploadEvidenceBodySchema>;
