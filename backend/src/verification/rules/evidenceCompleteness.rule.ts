import crypto from "crypto";
import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";

export const generateFindingId = (): string => {
  return `FND-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
};

/**
 * Rule 1: EVIDENCE_COMPLETENESS
 * Verifies that minimum required evidence exists (Transaction document + Scale evidence).
 */
export class EvidenceCompletenessRule implements VerificationRule {
  public readonly ruleId = "EVIDENCE_COMPLETENESS";
  public readonly name = "Evidence Completeness";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const scaleEvidence = context.evidenceDocs.filter((e) => e.type === "SCALE_IMAGE");
    const documentEvidence = context.evidenceDocs.filter(
      (e) => e.type === "INVOICE" || e.type === "RECEIPT" || e.type === "CERTIFICATE"
    );

    const hasScale = scaleEvidence.length > 0;
    const hasDoc = documentEvidence.length > 0;

    if (hasScale && hasDoc) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: context.evidenceDocs.map((e) => e.evidenceId),
          message: "All required evidence categories (documents and scale images) are present.",
        },
      };
    }

    const missing: string[] = [];
    if (!hasScale) missing.push("scale evidence");
    if (!hasDoc) missing.push("transaction document");

    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "NOT_CHECKABLE",
        severity: "HIGH",
        evidenceIds: context.evidenceDocs.map((e) => e.evidenceId),
        message: `Critical evidence missing: ${missing.join(" and ")}.`,
      },
      finding: {
        findingId: generateFindingId(),
        ruleId: this.ruleId,
        type: "INCOMPLETE_EVIDENCE",
        severity: "HIGH",
        title: "Required Evidence Missing",
        description: `Verification cannot proceed because required evidence is missing: ${missing.join(" and ")}.`,
        evidenceIds: context.evidenceDocs.map((e) => e.evidenceId),
        recommendedAction: "Upload the missing supporting evidence files before verifying.",
      },
    };
  }
}
