import mongoose, { Document, Schema, Types } from "mongoose";

export interface IFinding extends Document {
  findingId: string;
  caseId: Types.ObjectId; // References CaseModel._id
  ruleId: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string;
  evidenceIds: string[];
  recommendedAction?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FindingSchema = new Schema<IFinding>(
  {
    findingId: {
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
    ruleId: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
    },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    evidenceIds: [{ type: String }],
    recommendedAction: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying findings per case
FindingSchema.index({ caseId: 1, severity: 1 });

export const FindingModel = mongoose.model<IFinding>("Finding", FindingSchema);
