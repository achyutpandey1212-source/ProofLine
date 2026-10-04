import { Request, Response, NextFunction } from "express";
import { EvidenceService } from "../services/evidence.service";
import { EvidenceType } from "../models/evidence.model";
import { AppError } from "../middleware/error.middleware";

export class EvidenceController {
  /**
   * POST /cases/:id/evidence
   * Uploads an evidence file to ImageKit and creates an Evidence record linked to the case.
   */
  public static async upload(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params["id"];
      if (!caseIdOrMongoId) {
        throw new AppError("Case identifier is required.", 400, "BAD_REQUEST");
      }

      const file = req.file;
      if (!file) {
        throw new AppError("Evidence file is required in 'file' field.", 400, "FILE_MISSING");
      }

      const evidenceType = req.body.type as EvidenceType;
      if (!evidenceType) {
        throw new AppError("Evidence 'type' is required.", 400, "TYPE_MISSING");
      }

      const evidenceDoc = await EvidenceService.ingestEvidence({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
        evidenceType,
        fileBuffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });

      res.status(201).json({
        success: true,
        data: {
          id: evidenceDoc._id,
          evidenceId: evidenceDoc.evidenceId,
          caseId: evidenceDoc.caseId,
          type: evidenceDoc.type,
          file: {
            url: evidenceDoc.file.url,
            name: evidenceDoc.file.name,
            mimeType: evidenceDoc.file.mimeType,
            sizeBytes: evidenceDoc.file.sizeBytes,
          },
          status: evidenceDoc.status,
          extraction: evidenceDoc.extraction,
          createdAt: evidenceDoc.createdAt,
          updatedAt: evidenceDoc.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /cases/:id/evidence
   * Retrieves all evidence for an owned case.
   */
  public static async listForCase(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params["id"];
      if (!caseIdOrMongoId) {
        throw new AppError("Case identifier is required.", 400, "BAD_REQUEST");
      }

      const evidenceList = await EvidenceService.getEvidenceForCase(
        req.user.userDoc._id,
        caseIdOrMongoId
      );

      res.status(200).json({
        success: true,
        data: evidenceList.map((e) => ({
          id: e._id,
          evidenceId: e.evidenceId,
          caseId: e.caseId,
          type: e.type,
          file: {
            url: e.file.url,
            name: e.file.name,
            mimeType: e.file.mimeType,
            sizeBytes: e.file.sizeBytes,
          },
          status: e.status,
          extraction: e.extraction,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }
}
