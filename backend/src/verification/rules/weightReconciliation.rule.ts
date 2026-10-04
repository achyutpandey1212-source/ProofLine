import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";
import { normalizeToKg } from "../normalization/normalizer";
import { VERIFICATION_CONFIG } from "../verification.config";

export interface AggregatedScaleResult {
  measuredTotalKg: number | null;
  scaleEvidenceIds: string[];
}

export const aggregateScaleWeights = (context: VerificationContext): AggregatedScaleResult => {
  const scaleEvidence = context.evidenceDocs.filter((e) => e.type === "SCALE_IMAGE");
  if (scaleEvidence.length === 0) {
    return { measuredTotalKg: null, scaleEvidenceIds: [] };
  }

  let totalKg = 0;
  const ids: string[] = [];

  for (const item of scaleEvidence) {
    ids.push(item.evidenceId);
    const data = item.extraction.data as { weight?: number | null; unit?: string | null } | undefined;

    if (!data || data.weight === null || data.weight === undefined) {
      // If any scale image has an unreadable/null weight, the aggregate is uncertain
      return { measuredTotalKg: null, scaleEvidenceIds: ids };
    }

    const normalized = normalizeToKg(data.weight, data.unit || "kg");
    if (!normalized) {
      return { measuredTotalKg: null, scaleEvidenceIds: ids };
    }

    totalKg += normalized.weightKg;
  }

  // Controlled precision (2 decimal places)
  return { measuredTotalKg: Math.round(totalKg * 100) / 100, scaleEvidenceIds: ids };
};

/**
 * Rule 3 & 5: WEIGHT_RECONCILIATION
 * Aggregates scale photos and compares against the claimed quantity.
 */
export class WeightReconciliationRule implements VerificationRule {
  public readonly ruleId = "WEIGHT_RECONCILIATION";
  public readonly name = "Weight Reconciliation & Aggregation";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const { measuredTotalKg, scaleEvidenceIds } = aggregateScaleWeights(context);

    // Normalize claimed case quantity
    const normalizedClaimed = normalizeToKg(context.caseDoc.claimedQuantity, context.caseDoc.unit);
    if (!normalizedClaimed) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "NOT_CHECKABLE",
          severity: "HIGH",
          evidenceIds: scaleEvidenceIds,
          message: `Claimed case unit '${context.caseDoc.unit}' could not be normalized.`,
        },
      };
    }

    const claimedKg = normalizedClaimed.weightKg;

    // Handle missing or unreadable scale measurements
    if (measuredTotalKg === null) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "NOT_CHECKABLE",
          severity: "HIGH",
          evidenceIds: scaleEvidenceIds,
          values: { claimedWeight: claimedKg, measuredWeight: null },
          message: "Scale-supported weight could not be calculated due to missing or illegible scale readings.",
        },
        finding: {
          findingId: generateFindingId(),
          ruleId: this.ruleId,
          type: "WEIGHT_NOT_CHECKABLE",
          severity: "HIGH",
          title: "Scale Weight Indeterminate",
          description: "One or more scale images do not contain a clear numeric weight reading.",
          evidenceIds: scaleEvidenceIds,
          recommendedAction: "Review scale images manually or request clearer photographs.",
        },
      };
    }

    // Deterministic arithmetic calculations
    const differenceKg = Math.round((claimedKg - measuredTotalKg) * 100) / 100;
    const absDifferenceKg = Math.abs(differenceKg);
    const variancePercentage =
      claimedKg > 0 ? Math.round((absDifferenceKg / claimedKg) * 10000) / 100 : 0;

    const values = {
      claimedWeight: claimedKg,
      measuredWeight: measuredTotalKg,
      difference: differenceKg,
      variancePercentage,
      tolerancePercentage: VERIFICATION_CONFIG.weightTolerancePercent,
      unit: "kg",
    };

    // Tolerance evaluation
    if (variancePercentage <= VERIFICATION_CONFIG.weightTolerancePercent) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: scaleEvidenceIds,
          values,
          message: `Weight is within configured tolerance (${variancePercentage}% <= ${VERIFICATION_CONFIG.weightTolerancePercent}%).`,
        },
      };
    }

    // Discrepancy detected
    const isHighRisk = variancePercentage >= VERIFICATION_CONFIG.highRiskWeightDifferencePercent;
    const severity = isHighRisk ? "HIGH" : "MEDIUM";

    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "FAIL",
        severity,
        evidenceIds: scaleEvidenceIds,
        values,
        message: `Weight discrepancy detected: claimed ${claimedKg} kg vs measured ${measuredTotalKg} kg (variance: ${variancePercentage}%).`,
      },
      finding: {
        findingId: generateFindingId(),
        ruleId: this.ruleId,
        type: "WEIGHT_MISMATCH",
        severity,
        title: "Weight Discrepancy Detected",
        description: `The claimed weight (${claimedKg} kg) differs from the combined scale evidence (${measuredTotalKg} kg) by ${absDifferenceKg} kg (${variancePercentage}% variance), exceeding the ${VERIFICATION_CONFIG.weightTolerancePercent}% tolerance limit.`,
        evidenceIds: scaleEvidenceIds,
        recommendedAction: "Review quantity discrepancy with the partner or request clarification before approval.",
      },
    };
  }
}
