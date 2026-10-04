import mongoose, { Document, Schema, Types } from "mongoose";

export type CaseStatus =
  | "CREATED"
  | "EVIDENCE_UPLOADING"
  | "EVIDENCE_READY"
  | "PROCESSING"
  | "ANALYZING"
  | "VERIFICATION_COMPLETE"
  | "REVIEW_REQUIRED"
  | "ACCEPTED"
  | "REQUEST_CLARIFICATION"
  | "REJECTED"
  | "FURTHER_INVESTIGATION";

export type RiskLevel = "LOW" | "REVIEW_REQUIRED" | "HIGH";

export type HumanResolutionState =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CLARIFICATION_REQUESTED";

export interface ICase extends Document {
  caseId: string;
  userId: Types.ObjectId; // References UserModel._id
  organization?: string;
  transactionId: string;
  partnerName: string;
  material: string;
  claimedQuantity: number;
  unit: string;
  status: CaseStatus;
  riskLevel?: RiskLevel;
  resolutionState?: HumanResolutionState;
  resolutionNote?: string;
  resolvedBy?: Types.ObjectId;
  resolvedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    transactionId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    partnerName: {
      type: String,
      required: true,
      trim: true,
    },
    material: {
      type: String,
      required: true,
      trim: true,
    },
    claimedQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      default: "kg",
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "CREATED",
        "EVIDENCE_UPLOADING",
        "EVIDENCE_READY",
        "PROCESSING",
        "ANALYZING",
        "VERIFICATION_COMPLETE",
        "REVIEW_REQUIRED",
        "ACCEPTED",
        "REQUEST_CLARIFICATION",
        "REJECTED",
        "FURTHER_INVESTIGATION",
      ],
      default: "CREATED",
      index: true,
    },
    riskLevel: {
      type: String,
      enum: ["LOW", "REVIEW_REQUIRED", "HIGH"],
    },
    resolutionState: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_REQUESTED"],
      default: "PENDING_REVIEW",
      index: true,
    },
    resolutionNote: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    resolvedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to accelerate querying user-owned cases by date/status
CaseSchema.index({ userId: 1, createdAt: -1 });

export const CaseModel = mongoose.model<ICase>("Case", CaseSchema);
