import { VerificationContext, VerificationRule, RuleEvaluationOutput } from "./rules/rule.interface";
import { EvidenceCompletenessRule } from "./rules/evidenceCompleteness.rule";
import { ExtractionConfidenceRule } from "./rules/extractionConfidence.rule";
import { WeightReconciliationRule, aggregateScaleWeights } from "./rules/weightReconciliation.rule";
import { DocumentQuantityConsistencyRule } from "./rules/documentQuantityConsistency.rule";
import { EntityConsistencyRule } from "./rules/entityConsistency.rule";
import { TransactionIdConsistencyRule } from "./rules/transactionIdConsistency.rule";
import { normalizeToKg } from "./normalization/normalizer";
import { RiskLevel } from "../models/case.model";
import { IRuleResult } from "../models/verification.model";

export interface VerificationEngineResult {
  ruleResults: IRuleResult[];
  findings: NonNullable<RuleEvaluationOutput["finding"]>[];
  calculatedValues: {
    claimedWeight?: number;
    measuredWeight?: number;
    differenceWeight?: number;
    variancePercentage?: number;
    unit: string;
  };
  overallRisk: RiskLevel;
  summary: string;
}

export class VerificationEngine {
  private static rules: VerificationRule[] = [
    new EvidenceCompletenessRule(),
    new ExtractionConfidenceRule(),
    new WeightReconciliationRule(),
    new DocumentQuantityConsistencyRule(),
    new EntityConsistencyRule(),
    new TransactionIdConsistencyRule(),
  ];

  /**
   * Deterministically evaluates all verification rules against the provided context.
   * Completely pure function: no DB calls, no LLM invocations, 100% deterministic.
   */
  public static verify(context: VerificationContext): VerificationEngineResult {
    const ruleResults: IRuleResult[] = [];
    const findings: NonNullable<RuleEvaluationOutput["finding"]>[] = [];

    // 1. Evaluate all rules in sequence
    for (const rule of this.rules) {
      const output = rule.evaluate(context);
      ruleResults.push(output.ruleResult);
      if (output.finding) {
        findings.push(output.finding);
      }
    }

    // 2. Compute overarching calculated quantities for the Verification record
    const normClaimed = normalizeToKg(context.caseDoc.claimedQuantity, context.caseDoc.unit);
    const claimedKg = normClaimed ? normClaimed.weightKg : context.caseDoc.claimedQuantity;
    const { measuredTotalKg } = aggregateScaleWeights(context);

    let differenceWeight: number | undefined;
    let variancePercentage: number | undefined;

    if (measuredTotalKg !== null && claimedKg !== undefined) {
      differenceWeight = Math.round((claimedKg - measuredTotalKg) * 100) / 100;
      variancePercentage =
        claimedKg > 0 ? Math.round((Math.abs(differenceWeight) / claimedKg) * 10000) / 100 : 0;
    }

    // 3. Compute deterministic overall risk level per VERIFICATION_RULES.md
    // LOW: All critical checks pass with no medium/high findings
    // REVIEW_REQUIRED: One or more medium findings / uncertainty
    // HIGH: Multiple findings or any high-severity discrepancy
    const highSeverityCount = findings.filter((f) => f.severity === "HIGH").length;
    const mediumSeverityCount = findings.filter((f) => f.severity === "MEDIUM").length;

    let overallRisk: RiskLevel = "LOW";
    if (highSeverityCount > 0) {
      overallRisk = "HIGH";
    } else if (mediumSeverityCount > 0) {
      overallRisk = "REVIEW_REQUIRED";
    }

    // 4. Construct human-readable summary
    let summary: string;
    if (overallRisk === "LOW") {
      summary = "Available evidence is internally consistent within configured verification thresholds.";
    } else if (overallRisk === "REVIEW_REQUIRED") {
      summary = `Review required: ${mediumSeverityCount} moderate discrepancy/uncertainty finding(s) detected.`;
    } else {
      summary = `High-risk evidence inconsistency detected: ${highSeverityCount} significant finding(s) require human review before approval.`;
    }

    return {
      ruleResults,
      findings,
      calculatedValues: {
        claimedWeight: claimedKg,
        measuredWeight: measuredTotalKg ?? undefined,
        differenceWeight,
        variancePercentage,
        unit: "kg",
      },
      overallRisk,
      summary,
    };
  }
}
