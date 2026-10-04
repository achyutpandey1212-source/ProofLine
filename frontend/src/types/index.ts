export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  role: string;
  organization?: string;
}

export type CaseStatus =
  | "CREATED"
  | "EVIDENCE_UPLOADING"
  | "EVIDENCE_READY"
  | "PROCESSING"
  | "ANALYZING"
  | "VERIFICATION_COMPLETE"
  | "REVIEW_REQUIRED"
  | "ACCEPTED"
  | "REQUEST_CLARIFICATION"
  | "REJECTED"
  | "FURTHER_INVESTIGATION";

export type RiskLevel = "LOW" | "REVIEW_REQUIRED" | "HIGH";

export interface CaseItem {
  _id: string;
  caseId: string;
  transactionId: string;
  partnerName: string;
  material: string;
  claimedQuantity: number;
  unit: string;
  status: CaseStatus;
  riskLevel?: RiskLevel;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type EvidenceType =
  | "SCALE_IMAGE"
  | "INVOICE"
  | "RECEIPT"
  | "CERTIFICATE"
  | "MATERIAL_IMAGE"
  | "DOCUMENT"
  | "VIDEO"
  | "OTHER";

export type EvidenceStatus =
  | "UPLOADED"
  | "PROCESSING"
  | "EXTRACTED"
  | "VALIDATED"
  | "EXTRACTION_FAILED"
  | "INVALID_FILE"
  | "UNSUPPORTED"
  | "MANUAL_REVIEW";

export interface EvidenceItem {
  _id: string;
  evidenceId: string;
  caseId: string;
  type: EvidenceType;
  file: {
    provider: string;
    fileId: string;
    url: string;
    name: string;
    mimeType: string;
    sizeBytes: number;
  };
  status: EvidenceStatus;
  extraction?: {
    status?: "PENDING" | "EXTRACTED" | "FAILED" | "UNCERTAIN";
    confidence?: number;
    warnings?: string[];
    data?: Record<string, unknown>;
  };
  createdAt: string;
}

export interface RuleResultItem {
  ruleId: string;
  status: "PASS" | "FAIL" | "WARNING" | "NOT_CHECKABLE";
  severity: "LOW" | "MEDIUM" | "HIGH";
  evidenceIds: string[];
  message: string;
  values?: Record<string, unknown>;
}

export interface FindingItem {
  findingId: string;
  ruleId: string;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  title: string;
  description: string;
  evidenceIds: string[];
  recommendedAction?: string;
}

export interface VerificationReport {
  overallRisk: RiskLevel;
  status: string;
  summary?: string;
  calculatedValues: {
    claimedWeight?: number;
    measuredWeight?: number;
    differenceWeight?: number;
    variancePercentage?: number;
    unit?: string;
  };
  ruleResults: RuleResultItem[];
  findings: FindingItem[];
  verifiedAt?: string;
}

export interface WorkflowProgress {
  workflowId: string;
  status: "CREATED" | "RUNNING" | "WAITING_RETRY" | "FAILED" | "COMPLETED";
  step: string;
  processedEvidence: number;
  totalEvidence: number;
  retryCount: number;
  errorMessage?: string;
  startedAt: string;
  completedAt?: string;
}
