import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";

/**
 * Rule: EVIDENCE_REUSE_DETECTION
 * Evaluates evidence files for cryptographic content collision (SHA-256)
 * across prior transactions or within the same transaction.
 *
 * Product Principle:
 * "Proofline detects evidence integrity anomalies that make a claim unsafe to approve."
 */
export class EvidenceReuseDetectionRule implements VerificationRule {
  public readonly ruleId = "EVIDENCE_REUSE_DETECTION";
  public readonly name = "Evidence Fingerprint & Cross-Case Reuse";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const evidenceList = context.evidenceDocs;
    const collisions = context.crossCaseCollisions || [];

    // 1. Check for cross-case fingerprint collision
    if (collisions.length > 0) {
      const primaryCollision = collisions[0]!;
      const involvedEvidenceIds = collisions.map((c) => c.evidenceId);

      const collisionDetails = collisions
        .map(
          (c) =>
            `Evidence ${c.evidenceId} matches file fingerprint in Case ${c.collidingTransactionId} (${c.collidingCaseId})`
        )
        .join("; ");

      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "FAIL",
          severity: "HIGH",
          evidenceIds: involvedEvidenceIds,
          values: {
            collisionsCount: collisions.length,
            collisions,
          },
          message: `Cryptographic fingerprint collision detected: ${collisionDetails}`,
        },
        finding: {
          findingId: generateFindingId(),
          ruleId: this.ruleId,
          type: "REUSED_EVIDENCE_DETECTED",
          severity: "HIGH",
          title: "Cross-Case Evidence Reuse Detected",
          description: `Cryptographic fingerprint collision: one or more submitted documents share an identical SHA-256 hash with documents previously submitted in another transaction (${primaryCollision.collidingTransactionId}). This suggests duplicate submission or document reuse across separate physical claims.`,
          evidenceIds: involvedEvidenceIds,
          recommendedAction: `Inspect originating transaction ${primaryCollision.collidingTransactionId} and obtain independent re-weighing documentation before approving.`,
        },
      };
    }

    // 2. Check for intra-case duplicate file hash (same file uploaded multiple times in same case)
    const seenHashes = new Map<string, string>(); // hash -> evidenceId
    const intraDuplicates: { evidenceId1: string; evidenceId2: string; hash: string }[] = [];

    for (const ev of evidenceList) {
      const hash = ev.file.fileHash;
      if (hash) {
        if (seenHashes.has(hash)) {
          intraDuplicates.push({
            evidenceId1: seenHashes.get(hash)!,
            evidenceId2: ev.evidenceId,
            hash,
          });
        } else {
          seenHashes.set(hash, ev.evidenceId);
        }
      }
    }

    if (intraDuplicates.length > 0) {
      const dupeIds = Array.from(
        new Set(intraDuplicates.flatMap((d) => [d.evidenceId1, d.evidenceId2]))
      );

      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "WARNING",
          severity: "MEDIUM",
          evidenceIds: dupeIds,
          values: { intraDuplicates },
          message: `Duplicate file submission detected within current case: ${dupeIds.join(", ")} share identical content fingerprints.`,
        },
        finding: {
          findingId: generateFindingId(),
          ruleId: this.ruleId,
          type: "DUPLICATE_EVIDENCE_WITHIN_CASE",
          severity: "MEDIUM",
          title: "Duplicate Document File Fingerprint",
          description: `Two or more evidence files uploaded to this transaction (${dupeIds.join(", ")}) are bitwise identical (same SHA-256 fingerprint).`,
          evidenceIds: dupeIds,
          recommendedAction: "Review uploaded files to ensure distinct weighing slips were not inadvertently re-uploaded.",
        },
      };
    }

    // All clear
    return {
      ruleResult: {
        ruleId: this.ruleId,
        status: "PASS",
        severity: "LOW",
        evidenceIds: evidenceList.map((e) => e.evidenceId),
        values: {
          totalVerifiedHashes: seenHashes.size,
          crossCaseCollisions: 0,
        },
        message: "All evidence file fingerprints are unique and clear of cross-case collisions.",
      },
    };
  }
}
