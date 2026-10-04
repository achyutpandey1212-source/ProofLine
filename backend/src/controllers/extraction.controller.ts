import { Request, Response, NextFunction } from "express";
import { ExtractionService } from "../services/extraction.service";
import { AppError } from "../middleware/error.middleware";

export class ExtractionController {
  /**
   * POST /cases/:caseId/evidence/:evidenceId/extract
   * Triggers multimodal extraction for an existing evidence item owned by the user.
   */
  public static async extract(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params["caseId"];
      const evidenceIdOrMongoId = req.params["evidenceId"];

      if (!caseIdOrMongoId || !evidenceIdOrMongoId) {
        throw new AppError("Case and Evidence identifiers are required.", 400, "BAD_REQUEST");
      }

      const evidenceDoc = await ExtractionService.extractEvidence({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
        evidenceIdOrMongoId,
      });

      res.status(200).json({
        success: true,
        data: {
          id: evidenceDoc._id,
          evidenceId: evidenceDoc.evidenceId,
          caseId: evidenceDoc.caseId,
          type: evidenceDoc.type,
          status: evidenceDoc.status,
          extraction: {
            status: evidenceDoc.extraction.status,
            model: evidenceDoc.extraction.model,
            extractedAt: evidenceDoc.extraction.extractedAt,
            data: evidenceDoc.extraction.data,
            confidence: evidenceDoc.extraction.confidence,
            warnings: evidenceDoc.extraction.warnings,
          },
          updatedAt: evidenceDoc.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
