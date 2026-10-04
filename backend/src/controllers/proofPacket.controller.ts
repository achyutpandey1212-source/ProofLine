import { Request, Response, NextFunction } from "express";
import { ProofPacketService } from "../services/proofPacket.service";
import { AppError } from "../middleware/error.middleware";

export class ProofPacketController {
  /**
   * POST /cases/:caseId/proof-packet
   * Generates and returns structured JSON metadata or triggers PDF generation.
   */
  public static async getPacketMetadata(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params.caseId as string;
      const packetData = await ProofPacketService.getProofPacketData({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
      });

      res.status(200).json({
        success: true,
        data: {
          case: {
            caseId: packetData.caseDoc.caseId,
            transactionId: packetData.caseDoc.transactionId,
            partnerName: packetData.caseDoc.partnerName,
            material: packetData.caseDoc.material,
            claimedQuantity: packetData.caseDoc.claimedQuantity,
            unit: packetData.caseDoc.unit,
            status: packetData.caseDoc.status,
            riskLevel: packetData.caseDoc.riskLevel,
          },
          verification: {
            status: packetData.verificationDoc.status,
            overallRisk: packetData.verificationDoc.overallRisk,
            calculatedValues: packetData.verificationDoc.calculatedValues,
            summary: packetData.verificationDoc.summary,
            verifiedAt: packetData.verificationDoc.verifiedAt,
            ruleResults: packetData.verificationDoc.ruleResults,
          },
          findings: packetData.findingDocs.map((f) => ({
            findingId: f.findingId,
            ruleId: f.ruleId,
            type: f.type,
            severity: f.severity,
            title: f.title,
            description: f.description,
            evidenceIds: f.evidenceIds,
            recommendedAction: f.recommendedAction,
          })),
          evidenceCount: packetData.evidenceDocs.length,
          generatedAt: packetData.generatedAt,
          version: packetData.version,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /cases/:caseId/proof-packet/pdf
   * Returns a downloadable, professionally typeset PDF file.
   */
  public static async downloadPdf(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError("Authentication required.", 401, "UNAUTHORIZED");
      }

      const caseIdOrMongoId = req.params.caseId as string;
      const packetData = await ProofPacketService.getProofPacketData({
        userId: req.user.userDoc._id,
        caseIdOrMongoId,
      });

      const pdfBuffer = await ProofPacketService.generateProofPacketPdf(packetData);

      const safeTxId = packetData.caseDoc.transactionId.replace(/[^a-zA-Z0-9_-]/g, "_");
      const filename = `ProofPacket_${safeTxId}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      res.status(200).send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}
