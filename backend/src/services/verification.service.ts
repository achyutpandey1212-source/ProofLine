import mongoose from "mongoose";
import { CaseModel, ICase } from "../models/case.model";
import { EvidenceModel, IEvidence } from "../models/evidence.model";
import { VerificationModel, IVerification } from "../models/verification.model";
import { FindingModel, IFinding } from "../models/finding.model";
import { VerificationEngine, VerificationEngineResult } from "../verification/verification.engine";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

export interface VerificationExecutionResponse {
  verification: IVerification;
  findings: IFinding[];
  caseDoc: ICase;
}

export class VerificationService {
  /**
   * Executes deterministic verification on a case.
   * Ensures case ownership, verifies evidence readiness, evaluates pure rules,
   * idempotently updates/creates the Verification record, persists Findings,
   * and updates Case status and riskLevel.
   */
  public static async verifyCase(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
  }): Promise<VerificationExecutionResponse> {
    const { userId, caseIdOrMongoId } = params;

    // 1. Ownership check on Case
    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    // 2. Load all evidence belonging to this case
    const evidenceDocs: IEvidence[] = await EvidenceModel.find({ caseId: caseDoc._id });

    if (evidenceDocs.length === 0) {
      throw new AppError("No evidence files uploaded for this case.", 400, "NO_EVIDENCE");
    }

    // 3. Evidence Readiness Check:
    // Ensure that all uploaded evidence items have finished extraction
    const unextractedEvidence = evidenceDocs.filter((e) => e.status !== "EXTRACTED");
    if (unextractedEvidence.length > 0) {
      const pendingIds = unextractedEvidence.map((e) => `${e.evidenceId} (${e.status})`).join(", ");
      throw new AppError(
        `Cannot verify case because evidence extraction is not completed for: ${pendingIds}.`,
        400,
        "EVIDENCE_EXTRACTION_INCOMPLETE"
      );
    }

    // 4. Cross-case SHA-256 collision query:
    // Check if any evidence file in this case matches a file uploaded to another case
    const evidenceHashes = evidenceDocs
      .map((e) => e.file.fileHash)
      .filter((h): h is string => Boolean(h && h.length > 0));

    const crossCaseCollisions: {
      evidenceId: string;
      fileHash: string;
      collidingCaseId: string;
      collidingTransactionId: string;
      collidingEvidenceId: string;
      collidingUploadedAt: Date;
    }[] = [];

    if (evidenceHashes.length > 0) {
      const collidingEvidence = await EvidenceModel.find({
        caseId: { $ne: caseDoc._id },
        "file.fileHash": { $in: evidenceHashes },
      }).populate<{ caseId: ICase }>("caseId");

      for (const coll of collidingEvidence) {
        const localMatch = evidenceDocs.find((e) => e.file.fileHash === coll.file.fileHash);
        if (localMatch && coll.caseId) {
          crossCaseCollisions.push({
            evidenceId: localMatch.evidenceId,
            fileHash: coll.file.fileHash || "",
            collidingCaseId: coll.caseId.caseId,
            collidingTransactionId: coll.caseId.transactionId,
            collidingEvidenceId: coll.evidenceId,
            collidingUploadedAt: coll.createdAt,
          });
        }
      }
    }

    // 5. Run deterministic verification engine
    const engineResult: VerificationEngineResult = VerificationEngine.verify({
      caseDoc,
      evidenceDocs,
      crossCaseCollisions,
    });

    // 5. Idempotent Verification Persistence:
    // Upsert the Verification record for this case to avoid duplicate records
    let verificationDoc = await VerificationModel.findOne({ caseId: caseDoc._id });

    if (!verificationDoc) {
      verificationDoc = new VerificationModel({
        caseId: caseDoc._id,
      });
    }

    verificationDoc.status = "COMPLETED";
    verificationDoc.overallRisk = engineResult.overallRisk;
    verificationDoc.ruleResults = engineResult.ruleResults;
    verificationDoc.calculatedValues = engineResult.calculatedValues;
    verificationDoc.summary = engineResult.summary;
    verificationDoc.verifiedAt = new Date();

    await verificationDoc.save();

    // 6. Idempotent Finding Persistence:
    // Clear previously generated findings for this case and insert current findings
    await FindingModel.deleteMany({ caseId: caseDoc._id });

    const createdFindings: IFinding[] = [];
    if (engineResult.findings.length > 0) {
      const findingsToInsert = engineResult.findings.map((f) => ({
        findingId: f.findingId,
        caseId: caseDoc._id,
        ruleId: f.ruleId,
        type: f.type,
        severity: f.severity,
        title: f.title,
        description: f.description,
        evidenceIds: f.evidenceIds,
        recommendedAction: f.recommendedAction,
      }));

      const inserted = await FindingModel.insertMany(findingsToInsert);
      createdFindings.push(...inserted);
    }

    // 7. Update Case status & riskLevel
    caseDoc.status = engineResult.overallRisk === "LOW" ? "VERIFICATION_COMPLETE" : "REVIEW_REQUIRED";
    caseDoc.riskLevel = engineResult.overallRisk;
    await caseDoc.save();

    logger.info("Deterministic verification completed", {
      caseId: caseDoc.caseId,
      overallRisk: engineResult.overallRisk,
      findingCount: createdFindings.length,
      measuredWeight: engineResult.calculatedValues.measuredWeight,
    });

    return {
      verification: verificationDoc,
      findings: createdFindings,
      caseDoc,
    };
  }

  /**
   * Retrieves the verification report and findings for an owned case.
   */
  public static async getCaseVerification(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
  }): Promise<{ verification: IVerification | null; findings: IFinding[] }> {
    const { userId, caseIdOrMongoId } = params;

    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    const verification = await VerificationModel.findOne({ caseId: caseDoc._id });
    const findings = await FindingModel.find({ caseId: caseDoc._id }).sort({ severity: -1, createdAt: 1 });

    return { verification, findings };
  }
}
