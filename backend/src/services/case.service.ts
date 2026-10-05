import crypto from "crypto";
import mongoose from "mongoose";
import { CaseModel, ICase } from "../models/case.model";
import { CreateCaseDto } from "../validators/case.validator";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

export class CaseService {
  /**
   * Generates a readable, unique case identifier (e.g., PL-EW-A82F14).
   */
  private static generateCaseId(transactionId: string): string {
    const cleanTx = transactionId.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6) || "CASE";
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `PL-${cleanTx}-${randomSuffix}`;
  }

  /**
   * Creates a new verification case bound strictly to the authenticated user.
   */
  public static async createCase(
    userId: mongoose.Types.ObjectId,
    dto: CreateCaseDto
  ): Promise<ICase> {
    const caseId = this.generateCaseId(dto.transactionId);

    if (dto.isDemo) {
      await CaseModel.deleteMany({ userId, isDemo: true });
    }

    const newCase = await CaseModel.create({
      caseId,
      userId,
      transactionId: dto.transactionId,
      partnerName: dto.partnerName,
      material: dto.material,
      claimedQuantity: dto.claimedQuantity,
      unit: dto.unit || "kg",
      organization: dto.organization,
      notes: dto.notes,
      isDemo: Boolean(dto.isDemo),
      status: "CREATED",
    });

    logger.info("Verification case created", {
      caseId: newCase.caseId,
      userId: userId.toString(),
      transactionId: newCase.transactionId,
    });

    return newCase;
  }

  /**
   * Retrieves all cases owned by the authenticated user in descending order.
   */
  public static async listUserCases(userId: mongoose.Types.ObjectId): Promise<ICase[]> {
    return CaseModel.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Retrieves a single case ensuring ownership by the authenticated user.
   * If the case does not exist or belongs to another user, throws 404 to avoid leaking existence.
   */
  public static async getCaseById(
    userId: mongoose.Types.ObjectId,
    idOrCaseId: string
  ): Promise<ICase> {
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrCaseId);

    const query = isObjectId
      ? { $or: [{ _id: idOrCaseId }, { caseId: idOrCaseId }], userId }
      : { caseId: idOrCaseId, userId };

    const caseDoc = await CaseModel.findOne(query);

    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    return caseDoc;
  }
}
