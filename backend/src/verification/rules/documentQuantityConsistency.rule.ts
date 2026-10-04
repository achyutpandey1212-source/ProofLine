import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";
import { normalizeToKg } from "../normalization/normalizer";

/**
 * Rule 6: DOCUMENT_QUANTITY_CONSISTENCY
 * Compares quantities appearing across independent documents (Invoices, Receipts, Certificates).
 */
export class DocumentQuantityConsistencyRule implements VerificationRule {
  public readonly ruleId = "DOCUMENT_QUANTITY_CONSISTENCY";
  public readonly name = "Document Quantity Consistency";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const docEvidence = context.evidenceDocs.filter(
      (e) => e.type === "INVOICE" || e.type === "RECEIPT" || e.type === "CERTIFICATE"
    );

    if (docEvidence.length <= 1) {
      // Nothing to cross-check across documents
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: docEvidence.map((e) => e.evidenceId),
          message: "Single or no documents present; cross-document quantity comparison passed.",
        },
      };
    }

    const docQuantities: { evidenceId: string; type: string; quantityKg: number }[] = [];

    for (const doc of docEvidence) {
      const data = doc.extraction.data as { quantity?: number | null; quantityUnit?: string | null } | undefined;
      if (data && data.quantity !== null && data.quantity !== undefined) {
        const norm = normalizeToKg(data.quantity, data.quantityUnit || "kg");
        if (norm) {
          docQuantities.push({
            evidenceId: doc.evidenceId,
            type: doc.type,
            quantityKg: norm.weightKg,
          });
        }
      }
    }

    if (docQuantities.length <= 1) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: docEvidence.map((e) => e.evidenceId),
          message: "Insufficient readable document quantities to compare across documents.",
        },
      };
    }

    const firstQty = docQuantities[0]!.quantityKg;
    const hasDiscrepancy = docQuantities.some((d) => Math.abs(d.quantityKg - firstQty) > 0.01);

    const evidenceIds = docQuantities.map((d) => d.evidenceId);

    if (!hasDiscrepancy) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds,
          values: { consistentQuantityKg: firstQty, comparedDocuments: docQuantities },
          message: `All supporting documents state consistent quantities (${firstQty} kg).`,
        },
      };
    }

    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "FAIL",
        severity: "HIGH",
        evidenceIds,
        values: { comparedDocuments: docQuantities },
        message: "Conflicting quantities detected across independent documents.",
      },
      finding: {
        findingId: generateFindingId(),
        ruleId: this.ruleId,
        type: "DOCUMENT_QUANTITY_MISMATCH",
        severity: "HIGH",
        title: "Conflicting Document Quantities",
        description: `Quantities stated across submitted documents disagree: ${docQuantities
          .map((d) => `${d.type} (${d.evidenceId}): ${d.quantityKg} kg`)
          .join(" vs ")}.`,
        evidenceIds,
        recommendedAction: "Investigate conflicting quantities across submitted invoices and certificates.",
      },
    };
  }
}
