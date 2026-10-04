import { Annotation } from "@langchain/langgraph";
import { WorkflowStatus, WorkflowStep } from "../models/workflowRun.model";
import { VerificationEngineResult } from "../verification/verification.engine";

export interface WorkflowEvidenceInfo {
  evidenceId: string;
  type: string;
  fileUrl: string;
  mimeType: string;
  status: string;
  extractionData?: Record<string, unknown>;
  confidence?: number;
  warnings?: string[];
}

export const VerificationWorkflowAnnotation = Annotation.Root({
  workflowId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  caseId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  caseBusinessId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  userId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  transactionId: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  partnerName: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "",
  }),
  claimedQuantity: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  unit: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => "kg",
  }),
  evidenceList: Annotation<WorkflowEvidenceInfo[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  pendingEvidenceIds: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  extractedEvidenceIds: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  failedEvidenceIds: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  verificationEngineResult: Annotation<VerificationEngineResult | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  persistedVerificationId: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  persistedFindingIds: Annotation<string[]>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  currentStep: Annotation<WorkflowStep>({
    reducer: (x, y) => y ?? x,
    default: () => "INIT",
  }),
  workflowStatus: Annotation<WorkflowStatus>({
    reducer: (x, y) => y ?? x,
    default: () => "CREATED",
  }),
  retryCount: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 0,
  }),
  maxRetries: Annotation<number>({
    reducer: (x, y) => y ?? x,
    default: () => 3,
  }),
  errorMessage: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  errorDetails: Annotation<Record<string, unknown> | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
  startedAt: Annotation<string>({
    reducer: (x, y) => y ?? x,
    default: () => new Date().toISOString(),
  }),
  completedAt: Annotation<string | undefined>({
    reducer: (x, y) => y ?? x,
    default: () => undefined,
  }),
});

export type VerificationWorkflowState = typeof VerificationWorkflowAnnotation.State;
export type VerificationWorkflowUpdate = typeof VerificationWorkflowAnnotation.Update;
