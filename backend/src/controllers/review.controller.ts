import { Request, Response, NextFunction } from "express";
import { ReviewService } from "../services/review.service";
import { AppError } from "../middleware/error.middleware";

export class ReviewController {
  /**
   * POST /cases/:id/review
   * Records an authenticated human review decision.
   */
  public static async recordReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params["id"];
      if (!caseIdOrMongoId) {
        throw new AppError("Case ID is required.", 400, "BAD_REQUEST");
      }

      const { decision, note } = req.body;
      const validDecisions = ["APPROVED", "REJECTED", "CLARIFICATION_REQUESTED"];
      if (!decision || !validDecisions.includes(decision)) {
        throw new AppError(
          `Invalid decision. Must be one of: ${validDecisions.join(", ")}`,
          400,
          "VALIDATION_ERROR"
        );
      }

      const summary = await ReviewService.recordDecision({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
        decision,
        note,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /cases/:id/review
   * Retrieves resolution summary and full audit trail for a case.
   */
  public static async getReviewSummary(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params["id"];
      if (!caseIdOrMongoId) {
        throw new AppError("Case ID is required.", 400, "BAD_REQUEST");
      }

      const summary = await ReviewService.getReviewSummary({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
      });

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }
}
