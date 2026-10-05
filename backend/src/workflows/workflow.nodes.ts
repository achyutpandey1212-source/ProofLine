import mongoose from "mongoose";
import { CaseModel } from "../models/case.model";
import { EvidenceModel } from "../models/evidence.model";
import { VerificationModel } from "../models/verification.model";
import { FindingModel } from "../models/finding.model";
import { WorkflowRunModel } from "../models/workflowRun.model";
import { ExtractionService } from "../services/extraction.service";
import { VerificationEngine } from "../verification/verification.engine";
import { VerificationWorkflowState, WorkflowEvidenceInfo } from "./workflow.state";
import { ApiKeyPool, FailureClass } from "../services/keyPool.service";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

/**
 * Helper to update persisted workflow run step and status.
 */
async function syncWorkflowRun(state: Partial<VerificationWorkflowState>): Promise<void> {
  if (!state.workflowId) return;
  try {
    const update: Record<string, unknown> = {};
    if (state.currentStep) update["currentStep"] = state.currentStep;
    if (state.workflowStatus) update["status"] = state.workflowStatus;
    if (state.extractedEvidenceIds) update["extractedEvidenceIds"] = state.extractedEvidenceIds;
    if (state.pendingEvidenceIds) update["pendingEvidenceIds"] = state.pendingEvidenceIds;
    if (state.failedEvidenceIds) update["failedEvidenceIds"] = state.failedEvidenceIds;
    if (state.retryCount !== undefined) update["retryCount"] = state.retryCount;
    if (state.errorMessage !== undefined) update["errorMessage"] = state.errorMessage;
    if (state.errorDetails !== undefined) update["errorDetails"] = state.errorDetails;
    if (state.evidenceList) {
      update["totalEvidenceCount"] = state.evidenceList.length;
      update["processedEvidenceCount"] = (state.extractedEvidenceIds || []).length;
    }
    if (state.completedAt) update["completedAt"] = new Date(state.completedAt);

    await WorkflowRunModel.updateOne({ workflowId: state.workflowId }, { $set: update });
  } catch (err) {
    logger.warn("Failed to sync workflow run document", {
      workflowId: state.workflowId,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Node 1: Load Case
 * Verifies case exists and is owned by the user.
 */
export async function loadCaseNode(
  state: VerificationWorkflowState
): Promise<Partial<VerificationWorkflowState>> {
  logger.info("[Workflow] Node 1: Load Case", { workflowId: state.workflowId, caseId: state.caseId });

  const userId = new mongoose.Types.ObjectId(state.userId);
  const isObjectId = mongoose.Types.ObjectId.isValid(state.caseId);
  const caseQuery = isObjectId
    ? { $or: [{ _id: state.caseId }, { caseId: state.caseId }], userId }
    : { caseId: state.caseId, userId };

  const caseDoc = await CaseModel.findOne(caseQuery);
  if (!caseDoc) {
    const errorMsg = "Verification case not found or access denied.";
    await syncWorkflowRun({
      workflowId: state.workflowId,
      currentStep: "FAILED",
      workflowStatus: "FAILED",
      errorMessage: errorMsg,
    });
    throw new AppError(errorMsg, 404, "NOT_FOUND");
  }

  // Update Case status to PROCESSING
  caseDoc.status = "PROCESSING";
  await caseDoc.save();

  const updates: Partial<VerificationWorkflowState> = {
    caseId: (caseDoc._id as mongoose.Types.ObjectId).toString(),
    caseBusinessId: caseDoc.caseId,
    transactionId: caseDoc.transactionId,
    partnerName: caseDoc.partnerName,
    claimedQuantity: caseDoc.claimedQuantity,
    unit: caseDoc.unit,
    currentStep: "LOAD_EVIDENCE",
  };

  await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
  return updates;
}

/**
 * Node 2: Load Evidence
 * Retrieves all evidence associated with the case.
 */
export async function loadEvidenceNode(
  state: VerificationWorkflowState
): Promise<Partial<VerificationWorkflowState>> {
  logger.info("[Workflow] Node 2: Load Evidence", { workflowId: state.workflowId, caseId: state.caseId });

  const evidenceDocs = await EvidenceModel.find({ caseId: new mongoose.Types.ObjectId(state.caseId) });

  const evidenceList: WorkflowEvidenceInfo[] = evidenceDocs.map((doc) => ({
    evidenceId: doc.evidenceId,
    type: doc.type,
    fileUrl: doc.file.url,
    mimeType: doc.file.mimeType,
    status: doc.status,
    extractionData: doc.extraction?.data,
    confidence: doc.extraction?.confidence,
    warnings: doc.extraction?.warnings,
  }));

  const pendingEvidenceIds: string[] = [];
  const extractedEvidenceIds: string[] = [];
  const failedEvidenceIds: string[] = [];

  for (const ev of evidenceList) {
    if (ev.status === "EXTRACTED") {
      extractedEvidenceIds.push(ev.evidenceId);
    } else if (ev.status === "EXTRACTION_FAILED" || ev.status === "INVALID_FILE") {
      failedEvidenceIds.push(ev.evidenceId);
    } else {
      pendingEvidenceIds.push(ev.evidenceId);
    }
  }

  const updates: Partial<VerificationWorkflowState> = {
    evidenceList,
    pendingEvidenceIds,
    extractedEvidenceIds,
    failedEvidenceIds,
    currentStep: "EVIDENCE_READINESS",
  };

  await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
  return updates;
}

/**
 * Node 3: Evidence Readiness
 * Verifies that required evidence is uploaded and ready for extraction/verification.
 */
export async function evidenceReadinessNode(
  state: VerificationWorkflowState
): Promise<Partial<VerificationWorkflowState>> {
  logger.info("[Workflow] Node 3: Evidence Readiness", {
    workflowId: state.workflowId,
    totalEvidence: state.evidenceList.length,
    pending: state.pendingEvidenceIds.length,
    alreadyExtracted: state.extractedEvidenceIds.length,
  });

  if (state.evidenceList.length === 0) {
    const errorMsg = "No evidence files uploaded for this case.";
    await syncWorkflowRun({
      workflowId: state.workflowId,
      currentStep: "FAILED",
      workflowStatus: "FAILED",
      errorMessage: errorMsg,
    });
    throw new AppError(errorMsg, 400, "NO_EVIDENCE");
  }

  // Next step is either EXTRACTION (if items are pending or need retry) or VERIFICATION
  const nextStep = state.pendingEvidenceIds.length > 0 ? "EXTRACTION" : "EXTRACTION_VALIDATION";

  const updates: Partial<VerificationWorkflowState> = {
    currentStep: nextStep,
  };

  await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
  return updates;
}

/**
 * Node 4: Extraction
 * For each pending evidence item, invokes the existing ExtractionService.
 * Reuses already-extracted items. Performs bounded concurrency (max 2 parallel).
 * Differentiates transient failures (retryable) from permanent failures.
 */
export async function extractionNode(
  state: VerificationWorkflowState
): Promise<Partial<VerificationWorkflowState>> {
  logger.info("[Workflow] Node 4: Extraction", {
    workflowId: state.workflowId,
    pendingCount: state.pendingEvidenceIds.length,
    retryCount: state.retryCount,
  });

  const userId = new mongoose.Types.ObjectId(state.userId);
  const updatedExtractedIds = [...state.extractedEvidenceIds];
  const updatedFailedIds = [...state.failedEvidenceIds];
  const updatedEvidenceList = [...state.evidenceList];

  const toExtract = [...state.pendingEvidenceIds];
  const transientErrors: string[] = [];
  const permanentErrors: string[] = [];

  // Process evidence items sequentially with gentle spacing to avoid Google API burst limits
  for (let i = 0; i < toExtract.length; i++) {
    const evidenceId = toExtract[i];
    if (!evidenceId) continue;

    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    try {
      const updatedDoc = await ExtractionService.extractEvidence({
        userId,
        caseIdOrMongoId: state.caseId,
        evidenceIdOrMongoId: evidenceId,
      });

      // Add to extracted list
      if (!updatedExtractedIds.includes(evidenceId)) {
        updatedExtractedIds.push(evidenceId);
      }

      // Update local state copy
      const idx = updatedEvidenceList.findIndex((e) => e.evidenceId === evidenceId);
      if (idx !== -1) {
        updatedEvidenceList[idx] = {
          evidenceId: updatedDoc.evidenceId,
          type: updatedDoc.type,
          fileUrl: updatedDoc.file.url,
          mimeType: updatedDoc.file.mimeType,
          status: updatedDoc.status,
          extractionData: updatedDoc.extraction?.data,
          confidence: updatedDoc.extraction?.confidence,
          warnings: updatedDoc.extraction?.warnings,
        };
      }
    } catch (err: unknown) {
      const failureClass: FailureClass = ApiKeyPool.classifyError(err);
      const errMsg = err instanceof Error ? err.message : String(err);

      logger.error(`[Workflow] Extraction failed for evidence ${evidenceId}`, {
        failureClass,
        error: errMsg,
      });

      const isPermanent =
        failureClass === "INVALID_REQUEST" ||
        (err instanceof AppError &&
          (err.code === "SCHEMA_VALIDATION_FAILED" ||
            err.code === "INVALID_MODEL_OUTPUT" ||
            err.code === "NOT_FOUND" ||
            err.code === "ALREADY_PROCESSING"));

      if (isPermanent) {
        permanentErrors.push(`${evidenceId}: ${errMsg}`);
        if (!updatedFailedIds.includes(evidenceId)) {
          updatedFailedIds.push(evidenceId);
        }
      } else {
        // Rate limit, quota, temporary failure, or network error
        transientErrors.push(`${evidenceId}: ${errMsg}`);
      }
    }
  }

  // Recalculate remaining pending IDs
  const remainingPending = toExtract.filter((id) => !updatedExtractedIds.includes(id));

  // If there are transient errors and remaining pending items, evaluate retry eligibility
  if (remainingPending.length > 0 && transientErrors.length > 0) {
    if (state.retryCount < state.maxRetries) {
      const nextRetry = state.retryCount + 1;
      logger.warn(`[Workflow] Transient extraction failure detected. Transitioning to WAITING_RETRY (Attempt ${nextRetry}/${state.maxRetries})`, {
        transientErrors,
      });

      // Pause to allow rate limits / transient spikes to clear
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const updates: Partial<VerificationWorkflowState> = {
        evidenceList: updatedEvidenceList,
        pendingEvidenceIds: remainingPending,
        extractedEvidenceIds: updatedExtractedIds,
        failedEvidenceIds: updatedFailedIds,
        retryCount: nextRetry,
        workflowStatus: "WAITING_RETRY",
        currentStep: "EXTRACTION",
        errorMessage: `Transient extraction failure: ${transientErrors[0]}`,
      };

      await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
      return updates;
    } else {
      // Retry exhaustion
      const errorMsg = `Exceeded maximum extraction retries (${state.maxRetries}). Last error: ${transientErrors[0]}`;
      const updates: Partial<VerificationWorkflowState> = {
        evidenceList: updatedEvidenceList,
        pendingEvidenceIds: remainingPending,
        extractedEvidenceIds: updatedExtractedIds,
        failedEvidenceIds: [...updatedFailedIds, ...remainingPending],
        workflowStatus: "FAILED",
        currentStep: "FAILED",
        errorMessage: errorMsg,
      };

      await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
      throw new AppError(errorMsg, 502, "EXTRACTION_RETRY_EXHAUSTED");
    }
  }

  if (permanentErrors.length > 0 && remainingPending.length > 0) {
    const errorMsg = `Permanent extraction error: ${permanentErrors.join("; ")}`;
    const updates: Partial<VerificationWorkflowState> = {
      evidenceList: updatedEvidenceList,
      pendingEvidenceIds: remainingPending,
      extractedEvidenceIds: updatedExtractedIds,
      failedEvidenceIds: updatedFailedIds,
      workflowStatus: "FAILED",
      currentStep: "FAILED",
      errorMessage: errorMsg,
    };

    await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
    throw new AppError(errorMsg, 400, "PERMANENT_EXTRACTION_FAILURE");
  }

  // All pending extractions completed successfully
  const updates: Partial<VerificationWorkflowState> = {
    evidenceList: updatedEvidenceList,
    pendingEvidenceIds: [],
    extractedEvidenceIds: updatedExtractedIds,
    failedEvidenceIds: updatedFailedIds,
    workflowStatus: "RUNNING",
    currentStep: "EXTRACTION_VALIDATION",
  };

  await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
  return updates;
}

/**
 * Node 5: Extraction Validation
 * Confirms every required evidence item has valid schema and EXTRACTED status.
 */
export async function extractionValidationNode(
  state: VerificationWorkflowState
): Promise<Partial<VerificationWorkflowState>> {
  logger.info("[Workflow] Node 5: Extraction Validation", {
    workflowId: state.workflowId,
    extractedCount: state.extractedEvidenceIds.length,
    failedCount: state.failedEvidenceIds.length,
  });

  if (state.failedEvidenceIds.length > 0) {
    const errorMsg = `Evidence extraction failed for: ${state.failedEvidenceIds.join(", ")}`;
    await syncWorkflowRun({
      workflowId: state.workflowId,
      currentStep: "FAILED",
      workflowStatus: "FAILED",
      errorMessage: errorMsg,
    });
    throw new AppError(errorMsg, 400, "EXTRACTION_FAILED");
  }

  // Ensure all evidence in list is EXTRACTED
  const unextracted = state.evidenceList.filter((e) => !state.extractedEvidenceIds.includes(e.evidenceId));
  if (unextracted.length > 0) {
    const errorMsg = `Unextracted evidence detected: ${unextracted.map((e) => e.evidenceId).join(", ")}`;
    await syncWorkflowRun({
      workflowId: state.workflowId,
      currentStep: "FAILED",
      workflowStatus: "FAILED",
      errorMessage: errorMsg,
    });
    throw new AppError(errorMsg, 400, "EVIDENCE_EXTRACTION_INCOMPLETE");
  }

  const updates: Partial<VerificationWorkflowState> = {
    currentStep: "NORMALIZATION",
  };

  await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
  return updates;
}

/**
 * Node 6 & 7: Normalization & Deterministic Verification
 * Invokes the pure VerificationEngine from Phase 3.3.
 */
export async function verificationNode(
  state: VerificationWorkflowState
): Promise<Partial<VerificationWorkflowState>> {
  logger.info("[Workflow] Node 6 & 7: Normalization & Deterministic Verification", {
    workflowId: state.workflowId,
    caseId: state.caseId,
  });

  const caseDoc = await CaseModel.findById(state.caseId);
  if (!caseDoc) {
    throw new AppError("Case document not found.", 404, "NOT_FOUND");
  }

  const evidenceDocs = await EvidenceModel.find({ caseId: caseDoc._id });

  // Pure deterministic rule evaluation
  const engineResult = VerificationEngine.verify({
    caseDoc,
    evidenceDocs,
  });

  const updates: Partial<VerificationWorkflowState> = {
    verificationEngineResult: engineResult,
    currentStep: "FINDINGS",
  };

  await syncWorkflowRun({ workflowId: state.workflowId, ...updates });
  return updates;
}

/**
 * Node 8, 9 & 10: Findings, Risk Assessment & Final Persistence
 * Idempotently updates/creates the Verification record, replaces Findings,
 * updates Case status and marks the workflow as COMPLETED.
 */
export async function finalPersistenceNode(
  state: VerificationWorkflowState
): Promise<Partial<VerificationWorkflowState>> {
  logger.info("[Workflow] Node 8, 9 & 10: Final Persistence", {
    workflowId: state.workflowId,
    overallRisk: state.verificationEngineResult?.overallRisk,
  });

  const engineResult = state.verificationEngineResult;
  if (!engineResult) {
    throw new AppError("Verification engine result missing.", 500, "ENGINE_RESULT_MISSING");
  }

  const caseDoc = await CaseModel.findById(state.caseId);
  if (!caseDoc) {
    throw new AppError("Case document not found during persistence.", 404, "NOT_FOUND");
  }

  // 1. Idempotently upsert Verification document
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

  // 2. Idempotently replace Findings for this case
  await FindingModel.deleteMany({ caseId: caseDoc._id });

  const persistedFindingIds: string[] = [];
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
    persistedFindingIds.push(...inserted.map((f) => f.findingId));
  }

  // 3. Update Case status & riskLevel
  caseDoc.status = engineResult.overallRisk === "LOW" ? "VERIFICATION_COMPLETE" : "REVIEW_REQUIRED";
  caseDoc.riskLevel = engineResult.overallRisk;
  await caseDoc.save();

  const completedAt = new Date().toISOString();

  // 4. Update workflow state to COMPLETED
  const updates: Partial<VerificationWorkflowState> = {
    persistedVerificationId: (verificationDoc._id as mongoose.Types.ObjectId).toString(),
    persistedFindingIds,
    currentStep: "COMPLETED",
    workflowStatus: "COMPLETED",
    completedAt,
  };

  await syncWorkflowRun({
    workflowId: state.workflowId,
    ...updates,
  });

  logger.info("[Workflow] Verification workflow completed successfully", {
    workflowId: state.workflowId,
    caseId: caseDoc.caseId,
    overallRisk: engineResult.overallRisk,
    findingsCount: persistedFindingIds.length,
  });

  return updates;
}
