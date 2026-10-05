import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";
import { normalizeTransactionId } from "../normalization/normalizer";

/**
 * Rule 8: TRANSACTION_ID_CONSISTENCY
 * Compares transaction/reference numbers across supporting documents against the declared case transactionId.
 */
export class TransactionIdConsistencyRule implements VerificationRule {
  public readonly ruleId = "TRANSACTION_ID_CONSISTENCY";
  public readonly name = "Transaction Identifier Consistency";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const expectedNormalized = normalizeTransactionId(context.caseDoc.transactionId);
    const docEvidence = context.evidenceDocs.filter(
      (e) => e.type === "INVOICE" || e.type === "RECEIPT" || e.type === "CERTIFICATE"
    );

    const comparedTxIds: { evidenceId: string; type: string; rawTxId: string; normalized: string }[] = [];

    for (const doc of docEvidence) {
      const data = doc.extraction.data as { transactionId?: string; invoiceNumber?: string; certificateNumber?: string } | undefined;
      const rawTxId = data?.transactionId;
      if (rawTxId && rawTxId.trim().length > 0) {
        comparedTxIds.push({
          evidenceId: doc.evidenceId,
          type: doc.type,
          rawTxId,
          normalized: normalizeTransactionId(rawTxId),
        });
      }
    }

    if (comparedTxIds.length === 0) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: docEvidence.map((e) => e.evidenceId),
          message: "No document-embedded transaction identifiers found to cross-check.",
        },
      };
    }

    const caseNotes = (context.caseDoc.notes || "").toUpperCase();
    const caseNotesNormalized = normalizeTransactionId(context.caseDoc.notes);

    const mismatched = comparedTxIds.filter((item) => {
      if (item.normalized === expectedNormalized) return false;
      if (caseNotesNormalized.includes(item.normalized)) return false;
      if (caseNotes.includes(item.rawTxId.toUpperCase())) return false;
      if (item.normalized.includes(expectedNormalized) || expectedNormalized.includes(item.normalized)) return false;
      return true;
    });
    const evidenceIds = comparedTxIds.map((e) => e.evidenceId);

    if (mismatched.length === 0) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds,
          values: { declaredTransactionId: context.caseDoc.transactionId, matchingDocuments: comparedTxIds },
          message: "Transaction identifiers across all supporting documents match the case record.",
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
          declaredTransactionId: context.caseDoc.transactionId,
          mismatches: mismatched,
        },
        message: "Transaction identifier mismatch detected on supporting documents.",
      },
      finding: {
        findingId: generateFindingId(),
        ruleId: this.ruleId,
        type: "TRANSACTION_ID_MISMATCH",
        severity: "HIGH",
        title: "Transaction ID Inconsistency",
        description: `Documents reference conflicting transaction IDs (${mismatched.map((m) => `'${m.rawTxId}' in ${m.type}`).join(", ")}) vs case '${context.caseDoc.transactionId}'.`,
        evidenceIds,
        recommendedAction: "Check whether documents from different shipments were mistakenly grouped.",
      },
    };
  }
}
