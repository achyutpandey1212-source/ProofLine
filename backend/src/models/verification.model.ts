import mongoose, { Document, Schema, Types } from "mongoose";

export type RuleStatus = "PASS" | "FAIL" | "WARNING" | "NOT_CHECKABLE";
export type RuleSeverity = "LOW" | "MEDIUM" | "HIGH";

export interface IRuleResult {
  ruleId: string;
  status: RuleStatus;
  severity: RuleSeverity;
  evidenceIds: string[];
  values?: Record<string, unknown>;
  message: string;
}

export interface IVerification extends Document {
  caseId: Types.ObjectId; // References CaseModel._id
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  overallRisk: "LOW" | "REVIEW_REQUIRED" | "HIGH";
  ruleResults: IRuleResult[];
  calculatedValues: {
    claimedWeight?: number;
    measuredWeight?: number;
    differenceWeight?: number;
    variancePercentage?: number;
    unit?: string;
  };
  summary?: string;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RuleResultSchema = new Schema<IRuleResult>(
  {
    ruleId: { type: String, required: true },
    status: {
      type: String,
      enum: ["PASS", "FAIL", "WARNING", "NOT_CHECKABLE"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },
    evidenceIds: [{ type: String }],
    values: { type: Schema.Types.Mixed },
    message: { type: String, required: true },
  },
  { _id: false }
);

const VerificationSchema = new Schema<IVerification>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "Case",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "COMPLETED", "FAILED"],
      default: "PENDING",
      index: true,
    },
    overallRisk: {
      type: String,
      enum: ["LOW", "REVIEW_REQUIRED", "HIGH"],
      default: "LOW",
    },
    ruleResults: [RuleResultSchema],
    calculatedValues: {
      claimedWeight: { type: Number },
      measuredWeight: { type: Number },
      differenceWeight: { type: Number },
      variancePercentage: { type: Number },
      unit: { type: String, default: "kg" },
    },
    summary: { type: String },
    verifiedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export const VerificationModel = mongoose.model<IVerification>("Verification", VerificationSchema);
