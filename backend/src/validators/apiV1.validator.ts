import { z } from "zod";

const ALLOWED_UNITS = ["kg", "g", "mt", "lbs", "ton", "tons"] as const;

export const createVerificationSchema = z.object({
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
    .string({ required_error: "unit is required" })
    .trim()
    .toLowerCase()
    .refine((u) => (ALLOWED_UNITS as readonly string[]).includes(u), {
      message: `Unsupported unit. Allowed units: ${ALLOWED_UNITS.join(", ")}`,
    }),
  organization: z
    .string()
    .trim()
    .max(200, "organization cannot exceed 200 characters")
    .optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "notes cannot exceed 2000 characters")
    .optional(),
});

export const verificationIdParamSchema = z.object({
  verificationId: z
    .string({ required_error: "verificationId is required" })
    .trim()
    .min(1, "verificationId cannot be empty")
    .max(100, "verificationId cannot exceed 100 characters"),
});

const ALLOWED_EVIDENCE_TYPES = [
  "SCALE_IMAGE",
  "INVOICE",
  "RECEIPT",
  "CERTIFICATE",
  "MATERIAL_IMAGE",
  "DOCUMENT",
  "VIDEO",
  "OTHER",
] as const;

export const uploadApiEvidenceBodySchema = z.object({
  evidenceType: z
    .string({ required_error: "evidenceType is required" })
    .trim()
    .toUpperCase()
    .refine((t) => (ALLOWED_EVIDENCE_TYPES as readonly string[]).includes(t), {
      message: `Invalid evidenceType. Allowed: ${ALLOWED_EVIDENCE_TYPES.join(", ")}`,
    }),
});

export const reviewVerificationBodySchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED", "CLARIFICATION_REQUESTED"], {
    required_error: "decision is required and must be APPROVED, REJECTED, or CLARIFICATION_REQUESTED",
  }),
  note: z.string().trim().max(2000).optional(),
});

export type CreateVerificationDto = z.infer<typeof createVerificationSchema>;
export type ReviewVerificationDto = z.infer<typeof reviewVerificationBodySchema>;
