import { Request, Response, NextFunction } from "express";
import { CaseService } from "../services/case.service";
import { CreateCaseDto } from "../validators/case.validator";
import { AppError } from "../middleware/error.middleware";

export class CaseController {
  /**
   * POST /cases
   * Creates a new verification case owned by the authenticated user.
   */
  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseDoc = await CaseService.createCase(
        req.user.userDoc._id,
        req.body as CreateCaseDto
      );

      res.status(201).json({
        success: true,
        data: {
          id: caseDoc._id,
          caseId: caseDoc.caseId,
          transactionId: caseDoc.transactionId,
          partnerName: caseDoc.partnerName,
          material: caseDoc.material,
          claimedQuantity: caseDoc.claimedQuantity,
          unit: caseDoc.unit,
          organization: caseDoc.organization,
          status: caseDoc.status,
          riskLevel: caseDoc.riskLevel,
          notes: caseDoc.notes,
          createdAt: caseDoc.createdAt,
          updatedAt: caseDoc.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /cases
   * Lists all cases belonging exclusively to the authenticated user.
   */
  public static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const cases = await CaseService.listUserCases(req.user.userDoc._id);

      res.status(200).json({
        success: true,
        data: cases.map((c) => ({
          id: c._id,
          caseId: c.caseId,
          transactionId: c.transactionId,
          partnerName: c.partnerName,
          material: c.material,
          claimedQuantity: c.claimedQuantity,
          unit: c.unit,
          organization: c.organization,
          status: c.status,
          riskLevel: c.riskLevel,
          notes: c.notes,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /cases/:id
   * Retrieves an owned case by ID. Blocks unauthorized access with 404.
   */
  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const id = req.params["id"];
      if (!id) {
        throw new AppError("Case ID is required.", 400, "BAD_REQUEST");
      }

      const caseDoc = await CaseService.getCaseById(req.user.userDoc._id, id);

      res.status(200).json({
        success: true,
        data: {
          id: caseDoc._id,
          caseId: caseDoc.caseId,
          transactionId: caseDoc.transactionId,
          partnerName: caseDoc.partnerName,
          material: caseDoc.material,
          claimedQuantity: caseDoc.claimedQuantity,
          unit: caseDoc.unit,
          organization: caseDoc.organization,
          status: caseDoc.status,
          riskLevel: caseDoc.riskLevel,
          notes: caseDoc.notes,
          createdAt: caseDoc.createdAt,
          updatedAt: caseDoc.updatedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /cases/:caseId/proof-graph
   * Retrieves the deterministic Evidence / Proof Graph for an owned case.
   */
  public static async getProofGraph(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseId = req.params["caseId"] || req.params["id"];
      if (!caseId) {
        throw new AppError("Case ID is required.", 400, "BAD_REQUEST");
      }

      const { ProofGraphService } = await import("../services/proofGraph.service");
      const graph = await ProofGraphService.getProofGraph({
        userId: req.user.userDoc._id,
        caseIdOrMongoId: caseId,
      });

      res.status(200).json({
        success: true,
        data: graph,
      });
    } catch (err) {
      next(err);
    }
  }
}
