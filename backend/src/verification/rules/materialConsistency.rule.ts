import { VerificationRule, VerificationContext, RuleEvaluationOutput } from "./rule.interface";
import { generateFindingId } from "./evidenceCompleteness.rule";

/**
 * Normalizes material descriptors for comparison (e.g. "PET Flakes", "PET plastic flakes").
 */
export const normalizeMaterialName = (mat: string | null | undefined): string => {
  if (!mat || typeof mat !== "string") return "";
  return mat
    .toLowerCase()
    .replace(/\b(plastic|recycled|clean|washed|flakes|granules|scrap|pellets|regrind)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

/**
 * Rule 10: MATERIAL_CONSISTENCY
 * Compares declared case material against extracted material descriptions across supporting documents.
 */
export class MaterialConsistencyRule implements VerificationRule {
  public readonly ruleId = "MATERIAL_CONSISTENCY";
  public readonly name = "Material Type Consistency";

  public evaluate(context: VerificationContext): RuleEvaluationOutput {
    const expectedRaw = context.caseDoc.material || "";
    const expectedNormalized = normalizeMaterialName(expectedRaw);

    const docEvidence = context.evidenceDocs.filter(
      (e) => e.type === "INVOICE" || e.type === "RECEIPT" || e.type === "CERTIFICATE" || e.type === "MATERIAL_IMAGE"
    );

    const comparedMaterials: { evidenceId: string; type: string; rawMaterial: string; normalized: string }[] = [];

    for (const doc of docEvidence) {
      const data = doc.extraction.data as { materialDescription?: string; material?: string } | undefined;
      const rawMat = data?.materialDescription || data?.material;
      if (rawMat && typeof rawMat === "string" && rawMat.trim().length > 0) {
        comparedMaterials.push({
          evidenceId: doc.evidenceId,
          type: doc.type,
          rawMaterial: rawMat,
          normalized: normalizeMaterialName(rawMat),
        });
      }
    }

    if (comparedMaterials.length === 0) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds: docEvidence.map((e) => e.evidenceId),
          message: "No document-embedded material descriptors found to cross-check.",
        },
      };
    }

    const mismatched = comparedMaterials.filter(
      (item) => item.normalized.length > 0 && expectedNormalized.length > 0 && item.normalized !== expectedNormalized
    );

    const evidenceIds = comparedMaterials.map((e) => e.evidenceId);

    if (mismatched.length === 0) {
      return {
        ruleResult: {
          ruleId: this.ruleId,
          status: "PASS",
          severity: "LOW",
          evidenceIds,
          values: { declaredMaterial: expectedRaw, matchingMaterials: comparedMaterials },
          message: "Material specifications on evidence match declared case material.",
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
          declaredMaterial: expectedRaw,
          mismatches: mismatched,
        },
        message: "Material specification discrepancy detected on supporting evidence.",
      },
      finding: {
        findingId: generateFindingId(),
        ruleId: this.ruleId,
        type: "MATERIAL_MISMATCH",
        severity: "HIGH",
        title: "Material Classification Discrepancy",
        description: `Evidence indicates conflicting material (${mismatched.map((m) => `'${m.rawMaterial}' in ${m.type}`).join(", ")}) vs declared case material '${expectedRaw}'.`,
        evidenceIds,
        recommendedAction: "Investigate material grade mismatch with supplier before issuing certification.",
      },
    };
  }
}
