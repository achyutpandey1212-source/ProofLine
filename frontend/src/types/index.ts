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

export type GraphNodeType =
  | "CASE"
  | "EVIDENCE"
  | "FACT"
  | "RULE"
  | "FINDING"
  | "RESULT";

export interface ProofGraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sublabel?: string;
  status?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "REVIEW_REQUIRED";
  category?: string;
  metadata: Record<string, unknown>;
  isSimulated?: boolean;
  // Dynamic layout coordinates computed on frontend
  x?: number;
  y?: number;
  column?: number;
}

export interface ProofGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationship:
    | "CONTAINS"
    | "EXTRACTED"
    | "USED_BY"
    | "PRODUCED"
    | "CONTRIBUTES_TO";
}

export interface ProofGraphDto {
  case: {
    caseId: string;
    transactionId: string;
    partnerName: string;
    material: string;
    claimedQuantity: number;
    unit: string;
    status: string;
    riskLevel?: string;
  };
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
  summary?: {
    totalEvidence: number;
    totalFacts: number;
    totalRulesEvaluated: number;
    totalFindings: number;
    overallRisk: string;
  };
}

export type SimulationScenario =
  | "WEIGHT_MISMATCH"
  | "INVOICE_MISMATCH"
  | "TRANSACTION_MISMATCH"
  | "EVIDENCE_INCONSISTENCY";

export interface SimulationResultDto {
  scenario: SimulationScenario;
  isSimulated: true;
  scenarioTitle: string;
  scenarioDescription: string;
  mutatedFields: {
    target: "CASE" | "EVIDENCE";
    identifier: string;
    field: string;
    originalValue: unknown;
    simulatedValue: unknown;
  }[];
  verification: {
    status: string;
    overallRisk: RiskLevel;
    summary: string;
    calculatedValues: VerificationReport["calculatedValues"];
    ruleResults: RuleResultItem[];
    findings: FindingItem[];
    verifiedAt: string;
  };
  proofGraph: ProofGraphDto;
}


