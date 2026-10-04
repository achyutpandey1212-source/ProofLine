import { IRuleResult } from "../../models/verification.model";
import { IEvidence } from "../../models/evidence.model";
import { ICase } from "../../models/case.model";

export interface VerificationContext {
  caseDoc: ICase;
  evidenceDocs: IEvidence[];
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
