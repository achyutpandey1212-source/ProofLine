import { IRuleResult } from "../../models/verification.model";
import { IEvidence } from "../../models/evidence.model";
import { ICase } from "../../models/case.model";

export interface CrossCaseCollisionInfo {
  evidenceId: string;
  fileHash: string;
  collidingCaseId: string;
  collidingTransactionId: string;
  collidingEvidenceId: string;
  collidingUploadedAt: Date;
}

export interface VerificationContext {
  caseDoc: ICase;
  evidenceDocs: IEvidence[];
  crossCaseCollisions?: CrossCaseCollisionInfo[];
}

export interface RuleEvaluationOutput {
  ruleResult: IRuleResult;
  finding?: {
    findingId: string;
    ruleId: string;
    type: string;
    severity: "LOW" | "MEDIUM" | "HIGH";
    title: string;
    description: string;
    evidenceIds: string[];
    recommendedAction?: string;
  };
}

export interface VerificationRule {
  ruleId: string;
  name: string;
  evaluate(context: VerificationContext): RuleEvaluationOutput;
}
