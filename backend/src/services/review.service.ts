import mongoose from "mongoose";
import { CaseModel, HumanResolutionState } from "../models/case.model";
import { ReviewDecisionModel, ReviewResolutionState } from "../models/reviewDecision.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../middleware/error.middleware";

export interface RecordReviewParams {
  userId: mongoose.Types.ObjectId;
  caseIdOrMongoId: string;
  decision: "APPROVED" | "REJECTED" | "CLARIFICATION_REQUESTED";
  note?: string;
}

export interface ReviewHistoryEntry {
  id: string;
  decision: ReviewResolutionState;
  note?: string;
  reviewer: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
  previousResolution?: ReviewResolutionState;
  decidedAt: string;
}

export interface CaseReviewSummary {
  caseId: string;
  transactionId: string;
  currentResolution: HumanResolutionState;
  resolutionNote?: string;
  resolvedAt?: string;
  reviewer?: {
    id: string;
    email: string;
    name?: string;
    role: string;
  };
  history: ReviewHistoryEntry[];
}

export class ReviewService {
  /**
   * Records a human review decision for a verification case.
   * Preserves historical decisions in audit trail and updates case resolution layer.
   * Does NOT mutate the automated verification results, findings, or measured weights.
   */
  public static async recordDecision(params: RecordReviewParams): Promise<CaseReviewSummary> {
    const { userId, caseIdOrMongoId, decision, note } = params;

    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    const previousResolution: ReviewResolutionState =
      (caseDoc.resolutionState as ReviewResolutionState) || "PENDING_REVIEW";

    // Create immutable audit log entry
    await ReviewDecisionModel.create({
      caseId: caseDoc._id,
      reviewedBy: userId,
      decision,
      note: note?.trim() || undefined,
      previousResolution,
      decidedAt: new Date(),
    });

    // Update case human resolution layer
    caseDoc.resolutionState = decision;
    caseDoc.resolutionNote = note?.trim() || undefined;
    caseDoc.resolvedBy = userId;
    caseDoc.resolvedAt = new Date();
    await caseDoc.save();

    return this.getReviewSummary({
      userId,
      caseIdOrMongoId,
    });
  }

  /**
   * Retrieves current resolution state and complete decision audit trail for a case.
   */
  public static async getReviewSummary(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
  }): Promise<CaseReviewSummary> {
    const { userId, caseIdOrMongoId } = params;

    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    // Load full historical audit trail
    const historyDocs = await ReviewDecisionModel.find({ caseId: caseDoc._id })
      .sort({ decidedAt: -1 })
      .populate("reviewedBy", "email name role")
      .lean();

    const history: ReviewHistoryEntry[] = historyDocs.map((doc: any) => ({
      id: String(doc._id),
      decision: doc.decision,
      note: doc.note,
      previousResolution: doc.previousResolution,
      decidedAt: new Date(doc.decidedAt).toISOString(),
      reviewer: {
        id: String(doc.reviewedBy?._id || doc.reviewedBy),
        email: doc.reviewedBy?.email || "reviewer@proofline.internal",
        name: doc.reviewedBy?.name,
        role: doc.reviewedBy?.role || "REVIEWER",
      },
    }));

    // Retrieve latest reviewer info if available
    let reviewerInfo: CaseReviewSummary["reviewer"] = undefined;
    if (caseDoc.resolvedBy) {
      const userDoc = await UserModel.findById(caseDoc.resolvedBy).lean();
      if (userDoc) {
        reviewerInfo = {
          id: String(userDoc._id),
          email: userDoc.email,
          name: userDoc.name,
          role: userDoc.role,
        };
      }
    }

    return {
      caseId: caseDoc.caseId,
      transactionId: caseDoc.transactionId,
      currentResolution: caseDoc.resolutionState || "PENDING_REVIEW",
      resolutionNote: caseDoc.resolutionNote,
      resolvedAt: caseDoc.resolvedAt ? new Date(caseDoc.resolvedAt).toISOString() : undefined,
      reviewer: reviewerInfo,
      history,
    };
  }
}
