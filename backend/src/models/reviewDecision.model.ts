import mongoose, { Document, Schema, Types } from "mongoose";

export type ReviewResolutionState =
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CLARIFICATION_REQUESTED";

export interface IReviewDecision extends Document {
  caseId: Types.ObjectId; // References CaseModel._id
  reviewedBy: Types.ObjectId; // References UserModel._id
  decision: ReviewResolutionState;
  note?: string;
  previousResolution?: ReviewResolutionState;
  decidedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewDecisionSchema = new Schema<IReviewDecision>(
  {
    caseId: {
      type: Schema.Types.ObjectId,
      ref: "Case",
      required: true,
      index: true,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    decision: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_REQUESTED", "ACCEPTED"],
      required: true,
      index: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    previousResolution: {
      type: String,
      enum: ["PENDING_REVIEW", "APPROVED", "REJECTED", "CLARIFICATION_REQUESTED"],
    },
    decidedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to query decision audit trail efficiently
ReviewDecisionSchema.index({ caseId: 1, decidedAt: -1 });

export const ReviewDecisionModel = mongoose.model<IReviewDecision>(
  "ReviewDecision",
  ReviewDecisionSchema
);
