import mongoose from "mongoose";
import crypto from "crypto";
import { CaseModel, ICase } from "../models/case.model";
import { VerificationModel, IVerification } from "../models/verification.model";
import { FindingModel, IFinding } from "../models/finding.model";
import { WorkflowRunModel, IWorkflowRun } from "../models/workflowRun.model";
import { verificationWorkflowApp } from "../workflows/verification.workflow";
import { VerificationWorkflowState } from "../workflows/workflow.state";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

export interface WorkflowExecutionResponse {
  workflowId: string;
  workflowStatus: string;
  verification?: IVerification;
  findings: IFinding[];
  caseDoc: ICase;
}

export class VerificationWorkflowService {
  /**
   * Triggers or resumes the LangGraph verification workflow for an owned case.
   * Concurrency protection: If a workflow for this case is already RUNNING, returns 409 or current run.
   * Resumability: Resumes from earliest incomplete evidence/step.
   * Idempotency: Re-running updates existing Verification document and replaces Findings.
   */
  public static async executeCaseWorkflow(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
  }): Promise<WorkflowExecutionResponse> {
    const { userId, caseIdOrMongoId } = params;

    // 1. Verify Case exists and is owned by the user
    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    // 2. Concurrency Protection:
    // Check if there is an active running workflow for this case
    const activeRun = await WorkflowRunModel.findOne({
      caseId: caseDoc._id,
      status: { $in: ["RUNNING", "WAITING_RETRY"] },
    });

    if (activeRun) {
      // Check if it's stale (e.g. older than 5 minutes)
      const isStale = Date.now() - activeRun.updatedAt.getTime() > 5 * 60 * 1000;
      if (!isStale) {
        throw new AppError(
          "A verification workflow is already in progress for this case.",
          409,
          "WORKFLOW_ALREADY_RUNNING"
        );
      } else {
        logger.warn("Marking stale workflow run as FAILED before starting new run", {
          workflowId: activeRun.workflowId,
          caseId: caseDoc.caseId,
        });
        activeRun.status = "FAILED";
        activeRun.errorMessage = "Workflow timed out or was interrupted.";
        await activeRun.save();
      }
    }

    // 3. Create a new WorkflowRun document
    const workflowId = `WF-${caseDoc.caseId}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
    const workflowRunDoc = new WorkflowRunModel({
      workflowId,
      caseId: caseDoc._id,
      userId,
      status: "RUNNING",
      currentStep: "INIT",
      startedAt: new Date(),
    });
    await workflowRunDoc.save();

    // 4. Initialize LangGraph workflow initial state
    const initialState: VerificationWorkflowState = {
      workflowId,
      caseId: (caseDoc._id as mongoose.Types.ObjectId).toString(),
      caseBusinessId: caseDoc.caseId,
      userId: userId.toString(),
      transactionId: caseDoc.transactionId,
      partnerName: caseDoc.partnerName,
      claimedQuantity: caseDoc.claimedQuantity,
      unit: caseDoc.unit,
      evidenceList: [],
      pendingEvidenceIds: [],
      extractedEvidenceIds: [],
      failedEvidenceIds: [],
      verificationEngineResult: undefined,
      persistedVerificationId: undefined,
      persistedFindingIds: [],
      currentStep: "INIT",
      workflowStatus: "RUNNING",
      retryCount: 0,
      maxRetries: 3,
      errorMessage: undefined,
      errorDetails: undefined,
      startedAt: new Date().toISOString(),
      completedAt: undefined,
    };

    logger.info("Invoking LangGraph verification workflow", {
      workflowId,
      caseId: caseDoc.caseId,
      userId: userId.toString(),
    });

    // 5. Execute LangGraph workflow
    try {
      const finalState = (await verificationWorkflowApp.invoke(initialState)) as VerificationWorkflowState;

      // Reload fresh documents from DB
      const updatedCaseDoc = (await CaseModel.findById(caseDoc._id)) as ICase;
      const verificationDoc = await VerificationModel.findOne({ caseId: caseDoc._id });
      const findings = await FindingModel.find({ caseId: caseDoc._id }).sort({ severity: -1 });

      return {
        workflowId,
        workflowStatus: finalState.workflowStatus,
        verification: verificationDoc ?? undefined,
        findings,
        caseDoc: updatedCaseDoc,
      };
    } catch (err: unknown) {
      logger.error("LangGraph verification workflow execution failed", {
        workflowId,
        caseId: caseDoc.caseId,
        error: err instanceof Error ? err.message : String(err),
      });

      // Ensure WorkflowRun document is marked FAILED if not already
      await WorkflowRunModel.updateOne(
        { workflowId },
        {
          $set: {
            status: "FAILED",
            currentStep: "FAILED",
            errorMessage: err instanceof Error ? err.message : "Workflow failure",
            completedAt: new Date(),
          },
        }
      );

      // Re-throw AppError or wrap standard error
      if (err instanceof AppError) {
        throw err;
      }
      throw new AppError(
        err instanceof Error ? err.message : "Verification workflow failed.",
        500,
        "WORKFLOW_EXECUTION_ERROR"
      );
    }
  }

  /**
   * Retrieves workflow execution progress / status for a case.
   */
  public static async getWorkflowStatus(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
  }): Promise<IWorkflowRun | null> {
    const { userId, caseIdOrMongoId } = params;

    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    return WorkflowRunModel.findOne({ caseId: caseDoc._id }).sort({ createdAt: -1 });
  }
}
