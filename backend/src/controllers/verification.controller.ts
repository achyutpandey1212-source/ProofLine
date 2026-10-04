import { Request, Response, NextFunction } from "express";
import { VerificationService } from "../services/verification.service";
import { AppError } from "../middleware/error.middleware";

export class VerificationController {
  /**
   * POST /cases/:caseId/verify
   * Runs deterministic verification on an owned case with extracted evidence.
   */
  public static async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params["caseId"];
      if (!caseIdOrMongoId) {
        throw new AppError("Case identifier is required.", 400, "BAD_REQUEST");
      }

      const result = await VerificationService.verifyCase({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
      });

      res.status(200).json({
        success: true,
        data: {
          caseId: result.caseDoc.caseId,
          status: result.caseDoc.status,
          overallRisk: result.verification.overallRisk,
          summary: result.verification.summary,
          calculatedValues: result.verification.calculatedValues,
          ruleResults: result.verification.ruleResults,
          findings: result.findings.map((f) => ({
            findingId: f.findingId,
            ruleId: f.ruleId,
            type: f.type,
            severity: f.severity,
            title: f.title,
            description: f.description,
            evidenceIds: f.evidenceIds,
            recommendedAction: f.recommendedAction,
          })),
          verifiedAt: result.verification.verifiedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /cases/:caseId/verification
   * Retrieves the current verification result and findings for an owned case.
   */
  public static async getVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params["caseId"];
      if (!caseIdOrMongoId) {
        throw new AppError("Case identifier is required.", 400, "BAD_REQUEST");
      }

      const result = await VerificationService.getCaseVerification({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
      });

      if (!result.verification) {
        throw new AppError("Verification has not been executed yet for this case.", 404, "NOT_VERIFIED");
      }

      res.status(200).json({
        success: true,
        data: {
          overallRisk: result.verification.overallRisk,
          status: result.verification.status,
          summary: result.verification.summary,
          calculatedValues: result.verification.calculatedValues,
          ruleResults: result.verification.ruleResults,
          findings: result.findings.map((f) => ({
            findingId: f.findingId,
            ruleId: f.ruleId,
            type: f.type,
            severity: f.severity,
            title: f.title,
            description: f.description,
            evidenceIds: f.evidenceIds,
            recommendedAction: f.recommendedAction,
          })),
          verifiedAt: result.verification.verifiedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}
