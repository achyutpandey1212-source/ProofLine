import mongoose from "mongoose";
import { CaseModel } from "../models/case.model";
import { EvidenceModel } from "../models/evidence.model";
import { VerificationModel } from "../models/verification.model";
import { FindingModel } from "../models/finding.model";
import { AppError } from "../middleware/error.middleware";

export type GraphNodeType =
  | "CASE"
  | "EVIDENCE"
  | "FACT"
  | "RULE"
  | "FINDING"
  | "RESULT";

export interface ProofGraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  sublabel?: string;
  status?: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "REVIEW_REQUIRED";
  category?: string;
  metadata: Record<string, unknown>;
  isSimulated?: boolean;
}

export interface ProofGraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  relationship:
    | "CONTAINS"
    | "EXTRACTED"
    | "USED_BY"
    | "PRODUCED"
    | "CONTRIBUTES_TO";
}

export interface ProofGraphDto {
  case: {
    caseId: string;
    transactionId: string;
    partnerName: string;
    material: string;
    claimedQuantity: number;
    unit: string;
    status: string;
    riskLevel?: string;
  };
  nodes: ProofGraphNode[];
  edges: ProofGraphEdge[];
  summary?: {
    totalEvidence: number;
    totalFacts: number;
    totalRulesEvaluated: number;
    totalFindings: number;
    overallRisk: string;
  };
}

export class ProofGraphService {
  /**
   * Constructs the deterministic Evidence / Proof Graph for an owned case.
   * Pulls real MongoDB models for Case, Evidence, Verification, and Findings.
   * Strips out any private storage credentials, provider keys, or secrets.
   */
  public static async getProofGraph(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
  }): Promise<ProofGraphDto> {
    const { userId, caseIdOrMongoId } = params;

    // 1. Ownership & existence check on Case
    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    // 2. Fetch all related documents
    const [evidenceDocs, verificationDoc, findingDocs] = await Promise.all([
      EvidenceModel.find({ caseId: caseDoc._id }).sort({ createdAt: 1 }),
      VerificationModel.findOne({ caseId: caseDoc._id }),
      FindingModel.find({ caseId: caseDoc._id }).sort({ createdAt: 1 }),
    ]);

    return this.buildGraphFromData({
      caseDoc,
      evidenceDocs,
      verificationDoc,
      findingDocs,
    });
  }

  /**
   * Pure graph construction method that accepts data models or clones.
   */
  public static buildGraphFromData(params: {
    caseDoc: any;
    evidenceDocs: any[];
    verificationDoc: any;
    findingDocs: any[];
  }): ProofGraphDto {
    const { caseDoc, evidenceDocs, verificationDoc, findingDocs } = params;

    const nodes: ProofGraphNode[] = [];
    const edges: ProofGraphEdge[] = [];

    // --- NODE 1: CASE NODE ---
    const caseNodeId = `case-${caseDoc.caseId}`;
    nodes.push({
      id: caseNodeId,
      type: "CASE",
      label: caseDoc.transactionId,
      sublabel: `Case ${caseDoc.caseId}`,
      status: caseDoc.status,
      severity: caseDoc.riskLevel,
      category: "Case Context",
      metadata: {
        caseId: caseDoc.caseId,
        transactionId: caseDoc.transactionId,
        partnerName: caseDoc.partnerName,
        material: caseDoc.material,
        claimedQuantity: caseDoc.claimedQuantity,
        unit: caseDoc.unit,
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
      },
    });

    // --- NODES: EVIDENCE & EXTRACTED FACTS ---
    // Keep map of evidenceId -> factNodeIds for linking to rules
    const evidenceToFactNodes = new Map<string, string[]>();
    const evidenceFactKeyMap = new Map<string, Map<string, string>>(); // evidenceId -> (factKey -> factNodeId)

    for (const ev of evidenceDocs) {
      const evNodeId = `evidence-${ev.evidenceId}`;
      const safeFilename = ev.file.name;
      const extractionStatus = ev.extraction.status;

      nodes.push({
        id: evNodeId,
        type: "EVIDENCE",
        label: ev.type.replace(/_/g, " "),
        sublabel: safeFilename,
        status: ev.status,
        category: ev.type,
        metadata: {
          evidenceId: ev.evidenceId,
          type: ev.type,
          filename: safeFilename,
          status: ev.status,
          extractionStatus,
          confidence: ev.extraction.confidence,
          // safe public file url only, no private credentials or provider keys
          url: ev.file.url,
        },
      });

      // CASE -> EVIDENCE edge
      edges.push({
        id: `edge-${caseNodeId}-${evNodeId}`,
        source: caseNodeId,
        target: evNodeId,
        label: "CONTAINS",
        relationship: "CONTAINS",
      });

      // Child Extracted Fact nodes - curate key verification and business facts
      const factNodeIds: string[] = [];
      const factKeys = new Map<string, string>();
      const extractionData = ev.extraction.data;

      // Key fields that matter for provenance verification
      // Curate primary verification facts (avoiding clutter like raw timestamps and scale serials)
      const ALLOWED_FACT_KEYS = new Set([
        "weight",
        "quantity",
        "netWeight",
        "transactionId",
        "invoiceNumber",
        "sellerName",
        "issuerName",
        "materialDescription",
        "material",
      ]);

      if (extractionData && typeof extractionData === "object") {
        for (const [key, rawVal] of Object.entries(extractionData)) {
          if (rawVal === null || rawVal === undefined || rawVal === "") continue;
          if (typeof rawVal === "object") continue; // skip nested structures
          if (!ALLOWED_FACT_KEYS.has(key)) continue; // ignore uncurated/raw OCR dump fields

          // Format value nicely
          let displayVal = String(rawVal);
          if ((key === "weight" || key === "netWeight" || key === "grossWeight" || key === "tareWeight") && typeof rawVal === "number") {
            const unit = (extractionData as Record<string, unknown>)["unit"] || "kg";
            displayVal = `${rawVal} ${unit}`;
          } else if (key === "quantity" && typeof rawVal === "number") {
            const unit = (extractionData as Record<string, unknown>)["quantityUnit"] || "kg";
            displayVal = `${rawVal} ${unit}`;
          }

          // Skip secondary unit fields
          if (key === "unit" || key === "quantityUnit") continue;

          const factId = `fact-${ev.evidenceId}-${key}`;
          const formattedKey = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())
            .trim();

          nodes.push({
            id: factId,
            type: "FACT",
            label: formattedKey,
            sublabel: displayVal,
            category: "Extracted Fact",
            metadata: {
              evidenceId: ev.evidenceId,
              field: key,
              value: rawVal,
              displayValue: displayVal,
              confidence: ev.extraction.confidence,
            },
          });

          // EVIDENCE -> FACT edge
          edges.push({
            id: `edge-${evNodeId}-${factId}`,
            source: evNodeId,
            target: factId,
            label: "EXTRACTED",
            relationship: "EXTRACTED",
          });

          factNodeIds.push(factId);
          factKeys.set(key, factId);
        }
      }

      evidenceToFactNodes.set(ev.evidenceId, factNodeIds);
      evidenceFactKeyMap.set(ev.evidenceId, factKeys);
    }

    // --- NODES: VERIFICATION RULES ---
    const ruleNodeMap = new Map<string, string>();

    const ruleResults = verificationDoc?.ruleResults || [];
    for (const ruleRes of ruleResults) {
      const ruleNodeId = `rule-${ruleRes.ruleId}`;
      ruleNodeMap.set(ruleRes.ruleId, ruleNodeId);

      const ruleTitle = ruleRes.ruleId
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (c: string) => c.toUpperCase());

      nodes.push({
        id: ruleNodeId,
        type: "RULE",
        label: ruleTitle,
        sublabel: ruleRes.status,
        status: ruleRes.status,
        severity: ruleRes.severity,
        category: "Verification Rule",
        metadata: {
          ruleId: ruleRes.ruleId,
          status: ruleRes.status,
          severity: ruleRes.severity,
          message: ruleRes.message,
          values: ruleRes.values,
          evidenceIds: ruleRes.evidenceIds,
        },
      });

      // Connect rules cleanly according to their domain
      const relevantEvidenceIds = ruleRes.evidenceIds || [];

      // Global document-level rules connect cleanly to EVIDENCE nodes
      if (ruleRes.ruleId === "EVIDENCE_COMPLETENESS" || ruleRes.ruleId === "EXTRACTION_CONFIDENCE") {
        for (const evId of relevantEvidenceIds) {
          const evNodeId = `evidence-${evId}`;
          edges.push({
            id: `edge-${evNodeId}-${ruleNodeId}`,
            source: evNodeId,
            target: ruleNodeId,
            label: "EVALUATES",
            relationship: "USED_BY",
          });
        }
      } else {
        // Specific consistency & reconciliation rules connect strictly to targeted facts
        for (const evId of relevantEvidenceIds) {
          const factKeys = evidenceFactKeyMap.get(evId);
          let targetedFactId: string | undefined;

          if (ruleRes.ruleId === "WEIGHT_RECONCILIATION") {
            targetedFactId = factKeys?.get("weight") || factKeys?.get("netWeight");
          } else if (ruleRes.ruleId === "ENTITY_CONSISTENCY") {
            targetedFactId = factKeys?.get("sellerName") || factKeys?.get("issuerName");
          } else if (ruleRes.ruleId === "TRANSACTION_ID_CONSISTENCY") {
            targetedFactId = factKeys?.get("transactionId") || factKeys?.get("invoiceNumber");
          } else if (ruleRes.ruleId === "DOCUMENT_QUANTITY_CONSISTENCY") {
            targetedFactId = factKeys?.get("quantity") || factKeys?.get("weight");
          } else if (ruleRes.ruleId === "MATERIAL_CONSISTENCY") {
            targetedFactId = factKeys?.get("materialDescription") || factKeys?.get("material");
          }

          if (targetedFactId) {
            edges.push({
              id: `edge-${targetedFactId}-${ruleNodeId}`,
              source: targetedFactId,
              target: ruleNodeId,
              label: "USED BY",
              relationship: "USED_BY",
            });
          } else {
            // Only connect evidence if no targeted fact exists
            const evNodeId = `evidence-${evId}`;
            edges.push({
              id: `edge-${evNodeId}-${ruleNodeId}`,
              source: evNodeId,
              target: ruleNodeId,
              label: "USED BY",
              relationship: "USED_BY",
            });
          }
        }
      }
    }

    // --- NODES: FINDINGS ---
    const findingNodeMap = new Map<string, string>();

    for (const f of findingDocs) {
      const findingNodeId = `finding-${f.findingId}`;
      findingNodeMap.set(f.findingId, findingNodeId);

      nodes.push({
        id: findingNodeId,
        type: "FINDING",
        label: f.title,
        sublabel: `${f.severity} Discrepancy`,
        status: f.severity,
        severity: f.severity,
        category: "Finding",
        metadata: {
          findingId: f.findingId,
          ruleId: f.ruleId,
          type: f.type,
          severity: f.severity,
          title: f.title,
          description: f.description,
          evidenceIds: f.evidenceIds,
          recommendedAction: f.recommendedAction,
        },
      });

      // RULE -> FINDING edge
      const parentRuleNodeId = ruleNodeMap.get(f.ruleId);
      if (parentRuleNodeId) {
        edges.push({
          id: `edge-${parentRuleNodeId}-${findingNodeId}`,
          source: parentRuleNodeId,
          target: findingNodeId,
          label: "PRODUCED",
          relationship: "PRODUCED",
        });
      }
    }

    // --- NODE: FINAL RESULT ---
    const finalResultNodeId = `result-${caseDoc.caseId}`;
    const overallRisk = verificationDoc?.overallRisk || caseDoc.riskLevel || "LOW";
    const finalStatus =
      overallRisk === "LOW" ? "VERIFIED" : "REVIEW REQUIRED";

    nodes.push({
      id: finalResultNodeId,
      type: "RESULT",
      label: finalStatus,
      sublabel: `${overallRisk} RISK`,
      status: finalStatus,
      severity: overallRisk,
      category: "Final Outcome",
      metadata: {
        status: finalStatus,
        risk: overallRisk,
        claimedWeight: verificationDoc?.calculatedValues?.claimedWeight ?? caseDoc.claimedQuantity,
        measuredWeight: verificationDoc?.calculatedValues?.measuredWeight,
        differenceWeight: verificationDoc?.calculatedValues?.differenceWeight,
        variancePercentage: verificationDoc?.calculatedValues?.variancePercentage,
        verifiedAt: verificationDoc?.verifiedAt,
        summary: verificationDoc?.summary,
      },
    });

    // FINDINGS / RULES -> FINAL RESULT
    // If there are findings, findings contribute to the final result
    if (findingDocs.length > 0) {
      for (const f of findingDocs) {
        const findingNodeId = `finding-${f.findingId}`;
        edges.push({
          id: `edge-${findingNodeId}-${finalResultNodeId}`,
          source: findingNodeId,
          target: finalResultNodeId,
          label: "CONTRIBUTES TO",
          relationship: "CONTRIBUTES_TO",
        });
      }
    }

    // Also connect key evaluation rules (e.g., Weight Reconciliation) to Final Result
    const keyRules = ruleResults.length > 0 ? ruleResults : [];
    for (const r of keyRules) {
      const rNodeId = `rule-${r.ruleId}`;
      // If this rule produced no findings or is the core weight reconciliation, link it to result
      const ruleHasFinding = findingDocs.some((f) => f.ruleId === r.ruleId);
      if (!ruleHasFinding || r.ruleId === "WEIGHT_RECONCILIATION") {
        edges.push({
          id: `edge-${rNodeId}-${finalResultNodeId}`,
          source: rNodeId,
          target: finalResultNodeId,
          label: "CONTRIBUTES TO",
          relationship: "CONTRIBUTES_TO",
        });
      }
    }

    return {
      case: {
        caseId: caseDoc.caseId,
        transactionId: caseDoc.transactionId,
        partnerName: caseDoc.partnerName,
        material: caseDoc.material,
        claimedQuantity: caseDoc.claimedQuantity,
        unit: caseDoc.unit,
        status: caseDoc.status,
        riskLevel: caseDoc.riskLevel,
      },
      nodes,
      edges,
      summary: {
        totalEvidence: evidenceDocs.length,
        totalFacts: nodes.filter((n) => n.type === "FACT").length,
        totalRulesEvaluated: ruleResults.length,
        totalFindings: findingDocs.length,
        overallRisk,
      },
    };
  }
}
