import crypto from "crypto";
import path from "path";
import mongoose from "mongoose";
import { CaseModel } from "../models/case.model";
import { EvidenceModel, IEvidence, EvidenceType } from "../models/evidence.model";
import { ImageKitService } from "./imagekit.service";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

export interface IngestEvidenceParams {
  userId: mongoose.Types.ObjectId;
  caseIdOrMongoId: string;
  evidenceType: EvidenceType;
  fileBuffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export class EvidenceService {
  /**
   * Generates a readable unique Evidence identifier (e.g., EVD-A8F21B).
   */
  private static generateEvidenceId(): string {
    const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
    return `EVD-${randomSuffix}`;
  }

  /**
   * Sanitizes filename to prevent directory traversal and special character issues.
   */
  private static sanitizeFileName(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase().slice(0, 10);
    const base = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 50);
    return `${base || "evidence"}${ext}`;
  }

  /**
   * Securely uploads evidence to ImageKit and persists metadata to MongoDB.
   * Enforces case ownership and rollback cleanup if database persistence fails.
   */
  public static async ingestEvidence(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
    evidenceType: EvidenceType;
    fileBuffer: Buffer;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }): Promise<IEvidence> {
    const { userId, caseIdOrMongoId, evidenceType, fileBuffer, originalName, mimeType, sizeBytes } =
      params;

    // 1. Verify Case exists and belongs to the authenticated user
    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    // 2. Sanitize filename
    const sanitizedName = this.sanitizeFileName(originalName);

    // 3. Upload to ImageKit
    let uploadResult: Awaited<ReturnType<typeof ImageKitService.uploadFile>>;
    try {
      uploadResult = await ImageKitService.uploadFile({
        fileBuffer,
        fileName: sanitizedName,
        caseId: caseDoc.caseId,
      });
    } catch (uploadErr) {
      if (uploadErr instanceof AppError) {
        throw uploadErr;
      }
      throw new AppError(
        "Failed to upload file to storage provider.",
        502,
        "STORAGE_UPLOAD_ERROR"
      );
    }

    // 4. Compute immutable SHA-256 content digest
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // 5. Persist Evidence document in MongoDB with atomicity cleanup
    const evidenceId = this.generateEvidenceId();

    try {
      const evidenceDoc = await EvidenceModel.create({
        evidenceId,
        caseId: caseDoc._id,
        uploadedBy: userId,
        type: evidenceType,
        file: {
          provider: "imagekit",
          fileId: uploadResult.fileId,
          url: uploadResult.url,
          name: sanitizedName,
          mimeType,
          sizeBytes,
          fileHash,
        },
        status: "UPLOADED",
        extraction: {
          status: "PENDING",
        },
      });

      // Update case status if it's currently CREATED
      if (caseDoc.status === "CREATED") {
        caseDoc.status = "EVIDENCE_UPLOADING";
        await caseDoc.save();
      }

      logger.info("Evidence successfully ingested", {
        evidenceId: evidenceDoc.evidenceId,
        caseId: caseDoc.caseId,
        evidenceType: evidenceDoc.type,
      });

      return evidenceDoc;
    } catch (dbErr) {
      // 5. Cleanup ImageKit file if MongoDB save fails
      logger.error("MongoDB persistence failed after ImageKit upload. Triggering cleanup rollback.", {
        fileId: uploadResult.fileId,
        caseId: caseDoc.caseId,
        error: dbErr instanceof Error ? dbErr.message : "Unknown error",
      });

      await ImageKitService.deleteFile(uploadResult.fileId);

      throw new AppError("Failed to record evidence in database.", 500, "DATABASE_ERROR");
    }
  }

  /**
   * Retrieves all evidence belonging to a case, strictly enforcing user ownership of the case.
   */
  public static async getEvidenceForCase(
    userId: mongoose.Types.ObjectId,
    caseIdOrMongoId: string
  ): Promise<IEvidence[]> {
    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    return EvidenceModel.find({ caseId: caseDoc._id }).sort({ createdAt: 1 });
  }
}
