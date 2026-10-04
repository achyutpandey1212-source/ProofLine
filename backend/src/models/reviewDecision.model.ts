import mongoose, { Document, Schema, Types } from "mongoose";

export type ReviewDecisionType =
  | "ACCEPTED"
  | "REQUEST_CLARIFICATION"
  | "REJECTED"
  | "FURTHER_INVESTIGATION";

export interface IReviewDecision extends Document {
  caseId: Types.ObjectId; // References CaseModel._id
  reviewedBy: Types.ObjectId; // References UserModel._id
  decision: ReviewDecisionType;
  comment?: string;
  clarificationRequestText?: string;
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
      enum: ["ACCEPTED", "REQUEST_CLARIFICATION", "REJECTED", "FURTHER_INVESTIGATION"],
      required: true,
      index: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    clarificationRequestText: {
      type: String,
      trim: true,
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

export const ReviewDecisionModel = mongoose.model<IReviewDecision>(
  "ReviewDecision",
  ReviewDecisionSchema
);
