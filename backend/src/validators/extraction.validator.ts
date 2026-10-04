import { z } from "zod";

// Base extraction metadata common across all extractions
const baseExtractionSchema = z.object({
  confidence: z.number().min(0).max(1).default(0.8),
  warnings: z.array(z.string()).default([]),
});

// 1. SCALE_IMAGE Extraction Schema
export const scaleImageExtractionSchema = baseExtractionSchema.extend({
  weight: z.number().nullable().default(null),
  unit: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  time: z.string().nullable().default(null),
  scaleIdentifier: z.string().nullable().default(null),
  visibleText: z.string().nullable().default(null),
});

// 2. INVOICE Extraction Schema
export const invoiceExtractionSchema = baseExtractionSchema.extend({
  invoiceNumber: z.string().nullable().default(null),
  invoiceDate: z.string().nullable().default(null),
  sellerName: z.string().nullable().default(null),
  buyerName: z.string().nullable().default(null),
  materialDescription: z.string().nullable().default(null),
  quantity: z.number().nullable().default(null),
  quantityUnit: z.string().nullable().default(null),
  transactionValue: z.number().nullable().default(null),
  currency: z.string().nullable().default(null),
  transactionId: z.string().nullable().default(null),
});

// 3. RECEIPT Extraction Schema
export const receiptExtractionSchema = baseExtractionSchema.extend({
  receiptNumber: z.string().nullable().default(null),
  date: z.string().nullable().default(null),
  sellerName: z.string().nullable().default(null),
  buyerName: z.string().nullable().default(null),
  materialDescription: z.string().nullable().default(null),
  quantity: z.number().nullable().default(null),
  quantityUnit: z.string().nullable().default(null),
  amount: z.number().nullable().default(null),
  currency: z.string().nullable().default(null),
});

// 4. CERTIFICATE Extraction Schema
export const certificateExtractionSchema = baseExtractionSchema.extend({
  certificateNumber: z.string().nullable().default(null),
  issuerName: z.string().nullable().default(null),
  holderName: z.string().nullable().default(null),
  issueDate: z.string().nullable().default(null),
  validUntil: z.string().nullable().default(null),
  materialDescription: z.string().nullable().default(null),
  quantity: z.number().nullable().default(null),
  quantityUnit: z.string().nullable().default(null),
  transactionId: z.string().nullable().default(null),
});

// 5. MATERIAL_IMAGE Extraction Schema
export const materialImageExtractionSchema = baseExtractionSchema.extend({
  materialType: z.string().nullable().default(null),
  visibleQuantity: z.string().nullable().default(null),
  packagingType: z.string().nullable().default(null),
  observations: z.array(z.string()).default([]),
});

// 6. DOCUMENT / GENERIC Extraction Schema
export const documentExtractionSchema = baseExtractionSchema.extend({
  documentTitle: z.string().nullable().default(null),
  documentDate: z.string().nullable().default(null),
  issuerName: z.string().nullable().default(null),
  referenceNumber: z.string().nullable().default(null),
  extractedText: z.string().nullable().default(null),
});

export const getSchemaForEvidenceType = (evidenceType: string) => {
  switch (evidenceType) {
    case "SCALE_IMAGE":
      return scaleImageExtractionSchema;
    case "INVOICE":
      return invoiceExtractionSchema;
    case "RECEIPT":
      return receiptExtractionSchema;
    case "CERTIFICATE":
      return certificateExtractionSchema;
    case "MATERIAL_IMAGE":
      return materialImageExtractionSchema;
    case "DOCUMENT":
    case "VIDEO":
    case "OTHER":
    default:
      return documentExtractionSchema;
  }
};
