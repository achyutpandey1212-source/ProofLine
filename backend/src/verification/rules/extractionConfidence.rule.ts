import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";
import { VERIFICATION_CONFIG } from "../verification.config";

/**
 * Rule 2 & Rule 9: EXTRACTION_CONFIDENCE
 * Verifies that AI extractions exceed the minimum confidence threshold (0.75).
 */
export class ExtractionConfidenceRule implements VerificationRule {
  public readonly ruleId = "EXTRACTION_CONFIDENCE";
  public readonly name = "Extraction Confidence Validation";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const uncertainEvidence = context.evidenceDocs.filter(
      (e) => (e.extraction.confidence ?? 1.0) < VERIFICATION_CONFIG.minExtractionConfidence
    );

    if (uncertainEvidence.length === 0) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: context.evidenceDocs.map((e) => e.evidenceId),
          message: "All evidence items have extraction confidence above required threshold.",
        },
      };
    }

    const lowConfidenceIds = uncertainEvidence.map((e) => e.evidenceId);

    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "WARNING",
        severity: "MEDIUM",
        evidenceIds: lowConfidenceIds,
        values: {
          threshold: VERIFICATION_CONFIG.minExtractionConfidence,
          uncertainEvidence: uncertainEvidence.map((e) => ({
            id: e.evidenceId,
            confidence: e.extraction.confidence,
            warnings: e.extraction.warnings,
          })),
        },
        message: "One or more evidence extractions had low confidence or clarity warnings.",
      },
      finding: {
        findingId: generateFindingId(),
        ruleId: this.ruleId,
        type: "LOW_CONFIDENCE_EXTRACTION",
        severity: "MEDIUM",
        title: "Uncertain Evidence Extraction",
        description: `Evidence item(s) ${lowConfidenceIds.join(", ")} could not be read with high confidence. Human review recommended.`,
        evidenceIds: lowConfidenceIds,
        recommendedAction: "Review original evidence photographs to confirm readings manually.",
      },
    };
  }
}
