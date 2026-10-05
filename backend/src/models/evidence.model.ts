import mongoose, { Document, Schema, Types } from "mongoose";

export type EvidenceType =
  | "SCALE_IMAGE"
  | "INVOICE"
  | "RECEIPT"
  | "CERTIFICATE"
  | "MATERIAL_IMAGE"
  | "DOCUMENT"
  | "VIDEO"
  | "OTHER";

export type EvidenceStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "EXTRACTED"
  | "VALIDATED"
  | "EXTRACTION_FAILED"
  | "INVALID_FILE"
  | "UNSUPPORTED"
  | "MANUAL_REVIEW";

export interface IEvidenceFile {
  provider: string; // e.g., "imagekit"
  fileId: string;
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  fileHash?: string; // SHA-256 cryptographic digest of raw file buffer
}

export interface IEvidenceExtraction {
  status: "PENDING" | "EXTRACTED" | "FAILED" | "UNCERTAIN";
  model?: string;
  extractedAt?: Date;
  data?: Record<string, unknown>;
  confidence?: number;
  warnings?: string[];
}

export interface IEvidence extends Document {
  evidenceId: string;
  caseId: Types.ObjectId; // References CaseModel._id
  uploadedBy: Types.ObjectId; // References UserModel._id
  type: EvidenceType;
  file: IEvidenceFile;
  status: EvidenceStatus;
  extraction: IEvidenceExtraction;
  relatedEvidenceIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EvidenceFileSchema = new Schema<IEvidenceFile>(
  {
    provider: { type: String, required: true, default: "imagekit" },
    fileId: { type: String, required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    fileHash: { type: String, trim: true },
  },
  { _id: false }
);

const EvidenceExtractionSchema = new Schema<IEvidenceExtraction>(
  {
    status: {
      type: String,
      enum: ["PENDING", "EXTRACTED", "FAILED", "UNCERTAIN"],
      default: "PENDING",
    },
    model: { type: String },
    extractedAt: { type: Date },
    data: { type: Schema.Types.Mixed },
    confidence: { type: Number, min: 0, max: 1 },
    warnings: [{ type: String }],
  },
  { _id: false }
);

const EvidenceSchema = new Schema<IEvidence>(
  {
    evidenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "Case",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "SCALE_IMAGE",
        "INVOICE",
        "RECEIPT",
        "CERTIFICATE",
        "MATERIAL_IMAGE",
        "DOCUMENT",
        "VIDEO",
        "OTHER",
      ],
      required: true,
      index: true,
    },
    file: {
      type: EvidenceFileSchema,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "UPLOADED",
        "PROCESSING",
        "EXTRACTED",
        "VALIDATED",
        "EXTRACTION_FAILED",
        "INVALID_FILE",
        "UNSUPPORTED",
        "MANUAL_REVIEW",
      ],
      default: "UPLOADED",
      index: true,
    },
    extraction: {
      type: EvidenceExtractionSchema,
      default: () => ({ status: "PENDING" }),
    },
    relatedEvidenceIds: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Compound index for querying evidence per case
EvidenceSchema.index({ caseId: 1, createdAt: 1 });
// Index for fast cross-case SHA-256 fingerprint collision checks
EvidenceSchema.index({ "file.fileHash": 1 });

export const EvidenceModel = mongoose.model<IEvidence>("Evidence", EvidenceSchema);
