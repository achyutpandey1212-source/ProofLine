import { Request, Response, NextFunction } from "express";
import { CaseService } from "../services/case.service";
import { EvidenceService } from "../services/evidence.service";
import { VerificationWorkflowService } from "../services/workflow.service";
import { ProofPacketService } from "../services/proofPacket.service";
import { CaseModel } from "../models/case.model";
import { VerificationModel } from "../models/verification.model";
import { EvidenceModel, EvidenceType } from "../models/evidence.model";
import { FindingModel } from "../models/finding.model";
import { WorkflowRunModel } from "../models/workflowRun.model";
import { CreateVerificationDto } from "../validators/apiV1.validator";

export class ApiV1Controller {
  /**
   * Helper: Resolves case document owned by the external client.
   * Accepts either Case.caseId, Case._id, or verificationId (ver_...).
   * Returns 404 (isolation guarantee) if not found or owned by another account.
   */
  private static async resolveOwnedCase(req: Request, verificationId: string) {
    const userDoc = req.externalClient?.userDoc;
    if (!userDoc) return null;

    let caseDoc = null;

    // Check by caseId or _id
    caseDoc = await CaseModel.findOne({
      $or: [
        { caseId: verificationId },
        ...(verificationId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: verificationId }] : []),
      ],
      userId: userDoc._id,
    });

    if (caseDoc) return caseDoc;

    // Or check if verificationId references a Verification document
    const verDoc = await VerificationModel.findOne({
      $or: [
        ...(verificationId.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: verificationId }] : []),
      ],
    });

    if (verDoc) {
      caseDoc = await CaseModel.findOne({
        _id: verDoc.caseId,
        userId: userDoc._id,
      });
      if (caseDoc) return caseDoc;
    }

    return null;
  }

  /**
   * POST /api/v1/verifications
   * Submits a transaction for verification.
   */
  public static async createVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const client = req.externalClient!;
      const body = req.body as CreateVerificationDto;

      const caseDoc = await CaseService.createCase(client.userDoc._id, {
        transactionId: body.transactionId,
        partnerName: body.partnerName,
        material: body.material,
        claimedQuantity: body.claimedQuantity,
        unit: body.unit,
        organization: body.organization,
        notes: body.notes,
      });

      res.status(201).json({
        id: caseDoc.caseId,
        transactionId: caseDoc.transactionId,
        partnerName: caseDoc.partnerName,
        material: caseDoc.material,
        claimedQuantity: caseDoc.claimedQuantity,
        unit: caseDoc.unit,
        status: "CREATED",
        createdAt: caseDoc.createdAt,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/verifications/:verificationId/evidence
   * Attaches an evidence file to the verification case.
   */
  public static async uploadEvidence(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const client = req.externalClient!;
      const verificationId = req.params["verificationId"]!;

      const caseDoc = await ApiV1Controller.resolveOwnedCase(req, verificationId);
      if (!caseDoc) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: `Verification resource '${verificationId}' not found.`,
            requestId: req.requestId,
          },
        });
        return;
      }

      const file = req.file;
      if (!file) {
        res.status(400).json({
          error: {
            code: "FILE_MISSING",
            message: "Evidence file is required in 'file' multipart field.",
            requestId: req.requestId,
          },
        });
        return;
      }

      const evidenceType = (req.body.evidenceType || req.body.type) as EvidenceType;
      if (!evidenceType) {
        res.status(400).json({
          error: {
            code: "TYPE_MISSING",
            message: "Field 'evidenceType' is required.",
            requestId: req.requestId,
          },
        });
        return;
      }

      const evidenceDoc = await EvidenceService.ingestEvidence({
        userId: client.userDoc._id,
        caseIdOrMongoId: String(caseDoc._id),
        evidenceType,
        fileBuffer: file.buffer,
        originalName: file.originalname,
        mimeType: file.mimetype,
        sizeBytes: file.size,
      });

      res.status(201).json({
        id: evidenceDoc.evidenceId,
        type: evidenceDoc.type,
        filename: evidenceDoc.file.name,
        status: evidenceDoc.status,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/verifications/:verificationId/run
   * Invokes the existing LangGraph verification pipeline as an external black-box.
   */
  public static async runVerification(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const client = req.externalClient!;
      const verificationId = req.params["verificationId"]!;

      const caseDoc = await ApiV1Controller.resolveOwnedCase(req, verificationId);
      if (!caseDoc) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: `Verification resource '${verificationId}' not found.`,
            requestId: req.requestId,
          },
        });
        return;
      }

      // Check if evidence exists
      const evidenceCount = await EvidenceModel.countDocuments({ caseId: caseDoc._id });
      if (evidenceCount === 0) {
        res.status(422).json({
          error: {
            code: "NO_EVIDENCE_ATTACHED",
            message: "Cannot run verification without attached evidence documents.",
            requestId: req.requestId,
          },
        });
        return;
      }

      // Trigger workflow
      const result = await VerificationWorkflowService.executeCaseWorkflow({
        userId: client.userDoc._id,
        caseIdOrMongoId: String(caseDoc._id),
      });

      res.status(200).json({
        verificationId: caseDoc.caseId,
        status: result.workflowStatus === "COMPLETED" ? "COMPLETED" : "PROCESSING",
      });
    } catch (err: any) {
      if (err?.code === "WORKFLOW_ALREADY_RUNNING") {
        res.status(409).json({
          error: {
            code: "VERIFICATION_IN_PROGRESS",
            message: "Verification is already actively running for this resource.",
            requestId: req.requestId,
          },
        });
        return;
      }
      next(err);
    }
  }

  /**
   * GET /api/v1/verifications/:verificationId
   * Returns verification result, metrics, status, and findings.
   */
  public static async getVerificationStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const verificationId = req.params["verificationId"]!;

      const caseDoc = await ApiV1Controller.resolveOwnedCase(req, verificationId);
      if (!caseDoc) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: `Verification resource '${verificationId}' not found.`,
            requestId: req.requestId,
          },
        });
        return;
      }

      const [verificationDoc, findingDocs, activeRun] = await Promise.all([
        VerificationModel.findOne({ caseId: caseDoc._id }),
        FindingModel.find({ caseId: caseDoc._id }),
        WorkflowRunModel.findOne({ caseId: caseDoc._id }).sort({ createdAt: -1 }),
      ]);

      // If never executed or still pending
      if (!verificationDoc || verificationDoc.status !== "COMPLETED") {
        const isRunning = activeRun && (activeRun.status === "RUNNING" || activeRun.status === "WAITING_RETRY");
        res.status(200).json({
          id: caseDoc.caseId,
          status: isRunning ? "PROCESSING" : "PENDING",
          createdAt: caseDoc.createdAt,
        });
        return;
      }

      const calc = verificationDoc.calculatedValues || {};
      const claimed = calc.claimedWeight ?? caseDoc.claimedQuantity;
      const measured = calc.measuredWeight ?? 0;
      const difference = calc.differenceWeight ?? (measured - claimed);
      const variancePercent = calc.variancePercentage ?? 0;

      const decision =
        verificationDoc.overallRisk === "LOW" ? "VERIFIED" : "REVIEW_REQUIRED";

      res.status(200).json({
        id: caseDoc.caseId,
        status: "COMPLETED",
        result: {
          decision,
          risk: verificationDoc.overallRisk,
          claimedQuantity: claimed,
          measuredQuantity: measured,
          difference: Math.abs(difference),
          variancePercent: Math.abs(variancePercent),
        },
        findings: findingDocs.map((f) => ({
          code: f.ruleId || f.type,
          severity: f.severity,
          title: f.title,
          message: f.description,
          evidenceIds: f.evidenceIds || [],
        })),
        createdAt: caseDoc.createdAt,
        completedAt: verificationDoc.verifiedAt || verificationDoc.updatedAt,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/verifications/:verificationId/proof-packet
   * Exports the official auditable Proof Packet PDF for an authorized verification.
   */
  public static async getProofPacket(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const client = req.externalClient!;
      const verificationId = req.params["verificationId"]!;

      const caseDoc = await ApiV1Controller.resolveOwnedCase(req, verificationId);
      if (!caseDoc) {
        res.status(404).json({
          error: {
            code: "NOT_FOUND",
            message: `Verification resource '${verificationId}' not found.`,
            requestId: req.requestId,
          },
        });
        return;
      }

      const packetData = await ProofPacketService.getProofPacketData({
        userId: client.userDoc._id,
        caseIdOrMongoId: String(caseDoc._id),
      });

      const pdfBuffer = await ProofPacketService.generateProofPacketPdf(packetData);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="proof-packet-${caseDoc.caseId}.pdf"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);
      res.status(200).send(pdfBuffer);
    } catch (err: any) {
      if (err?.code === "VERIFICATION_NOT_COMPLETE" || err?.statusCode === 400) {
        res.status(400).json({
          error: {
            code: "VERIFICATION_NOT_COMPLETE",
            message: "Complete verification before downloading Proof Packet.",
            requestId: req.requestId,
          },
        });
        return;
      }
      next(err);
    }
  }
}
