import { z } from "zod";

// Body schema for creating a verification case
export const createCaseSchema = z.object({
  transactionId: z
    .string({ required_error: "transactionId is required" })
    .trim()
    .min(1, "transactionId cannot be empty")
    .max(100, "transactionId cannot exceed 100 characters"),
  partnerName: z
    .string({ required_error: "partnerName is required" })
    .trim()
    .min(1, "partnerName cannot be empty")
    .max(200, "partnerName cannot exceed 200 characters"),
  material: z
    .string({ required_error: "material is required" })
    .trim()
    .min(1, "material cannot be empty")
    .max(100, "material cannot exceed 100 characters"),
  claimedQuantity: z
    .number({ required_error: "claimedQuantity is required" })
    .positive("claimedQuantity must be a positive number"),
  unit: z
    .string()
    .trim()
    .default("kg"),
  organization: z
    .string()
    .trim()
    .max(200)
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional(),
  isDemo: z
    .boolean()
    .optional(),
});

// Route parameter schema for case identification
export const caseParamSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1, "Case identifier is required")
    .max(100, "Invalid case identifier length"),
});

export type CreateCaseDto = z.infer<typeof createCaseSchema>;
export type CaseParamDto = z.infer<typeof caseParamSchema>;
