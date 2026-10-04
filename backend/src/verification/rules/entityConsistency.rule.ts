import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";
import { normalizeEntityName } from "../normalization/normalizer";

/**
 * Rule 7: ENTITY_CONSISTENCY
 * Compares partner/recycler entity names between the Case declaration and supporting documents.
 */
export class EntityConsistencyRule implements VerificationRule {
  public readonly ruleId = "ENTITY_CONSISTENCY";
  public readonly name = "Entity Name Consistency";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const expectedNormalized = normalizeEntityName(context.caseDoc.partnerName);
    const docEvidence = context.evidenceDocs.filter(
      (e) => e.type === "INVOICE" || e.type === "RECEIPT" || e.type === "CERTIFICATE"
    );

    const comparedEntities: { evidenceId: string; type: string; rawName: string; normalized: string }[] = [];

    for (const doc of docEvidence) {
      const data = doc.extraction.data as { sellerName?: string; issuerName?: string } | undefined;
      const rawName = data?.sellerName || data?.issuerName;
      if (rawName && rawName.trim().length > 0) {
        comparedEntities.push({
          evidenceId: doc.evidenceId,
          type: doc.type,
          rawName,
          normalized: normalizeEntityName(rawName),
        });
      }
    }

    if (comparedEntities.length === 0) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: docEvidence.map((e) => e.evidenceId),
          message: "No explicit entity names found in documents to cross-check.",
        },
      };
    }

    const mismatched = comparedEntities.filter(
      (item) => item.normalized !== expectedNormalized && !item.normalized.includes(expectedNormalized) && !expectedNormalized.includes(item.normalized)
    );

    const evidenceIds = comparedEntities.map((e) => e.evidenceId);

    if (mismatched.length === 0) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds,
          values: { declaredPartner: context.caseDoc.partnerName, matchingEntities: comparedEntities },
          message: "All document entity names match the declared case partner.",
        },
      };
    }

    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "FAIL",
        severity: "HIGH",
        evidenceIds,
        values: {
          declaredPartner: context.caseDoc.partnerName,
          mismatches: mismatched,
        },
        message: "Entity name mismatch detected between case record and supporting documents.",
      },
      finding: {
        findingId: generateFindingId(),
        ruleId: this.ruleId,
        type: "ENTITY_NAME_MISMATCH",
        severity: "HIGH",
        title: "Partner Entity Inconsistency",
        description: `Entity on documents (${mismatched.map((m) => `'${m.rawName}' in ${m.type}`).join(", ")}) does not match declared partner '${context.caseDoc.partnerName}'.`,
        evidenceIds,
        recommendedAction: "Verify recycler registration and ensure certificates belong to the intended vendor.",
      },
    };
  }
}
