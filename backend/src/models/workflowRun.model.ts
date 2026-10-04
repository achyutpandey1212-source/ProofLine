import mongoose, { Document, Schema, Types } from "mongoose";

export type WorkflowStatus = "CREATED" | "RUNNING" | "WAITING_RETRY" | "FAILED" | "COMPLETED";

export type WorkflowStep =
  | "INIT"
  | "LOAD_CASE"
  | "LOAD_EVIDENCE"
  | "EVIDENCE_READINESS"
  | "EXTRACTION"
  | "EXTRACTION_VALIDATION"
  | "NORMALIZATION"
  | "VERIFICATION"
  | "FINDINGS"
  | "RISK_ASSESSMENT"
  | "FINAL_PERSISTENCE"
  | "COMPLETED"
  | "FAILED";

export interface IWorkflowRun extends Document {
  workflowId: string;
  caseId: Types.ObjectId; // References CaseModel._id
  userId: Types.ObjectId; // References UserModel._id
  status: WorkflowStatus;
  currentStep: WorkflowStep;
  totalEvidenceCount: number;
  processedEvidenceCount: number;
  pendingEvidenceIds: string[];
  extractedEvidenceIds: string[];
  failedEvidenceIds: string[];
  retryCount: number;
  maxRetries: number;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowRunSchema = new Schema<IWorkflowRun>(
  {
    workflowId: {
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
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["CREATED", "RUNNING", "WAITING_RETRY", "FAILED", "COMPLETED"],
      default: "CREATED",
      index: true,
    },
    currentStep: {
      type: String,
      enum: [
        "INIT",
        "LOAD_CASE",
        "LOAD_EVIDENCE",
        "EVIDENCE_READINESS",
        "EXTRACTION",
        "EXTRACTION_VALIDATION",
        "NORMALIZATION",
        "VERIFICATION",
        "FINDINGS",
        "RISK_ASSESSMENT",
        "FINAL_PERSISTENCE",
        "COMPLETED",
        "FAILED",
      ],
      default: "INIT",
    },
    totalEvidenceCount: {
      type: Number,
      default: 0,
    },
    processedEvidenceCount: {
      type: Number,
      default: 0,
    },
    pendingEvidenceIds: [{ type: String }],
    extractedEvidenceIds: [{ type: String }],
    failedEvidenceIds: [{ type: String }],
    retryCount: {
      type: Number,
      default: 0,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    errorMessage: {
      type: String,
    },
    errorDetails: {
      type: Schema.Types.Mixed,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

WorkflowRunSchema.index({ caseId: 1, createdAt: -1 });

export const WorkflowRunModel = mongoose.model<IWorkflowRun>("WorkflowRun", WorkflowRunSchema);
