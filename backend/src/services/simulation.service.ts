import mongoose from "mongoose";
import { CaseModel, ICase } from "../models/case.model";
import { EvidenceModel, IEvidence } from "../models/evidence.model";
import { VerificationEngine, VerificationEngineResult } from "../verification/verification.engine";
import { ProofGraphDto, ProofGraphService } from "./proofGraph.service";
import { AppError } from "../middleware/error.middleware";
import { logger } from "../utils/logger";

export type SimulationScenario =
  | "WEIGHT_MISMATCH"
  | "INVOICE_MISMATCH"
  | "TRANSACTION_MISMATCH"
  | "EVIDENCE_INCONSISTENCY"
  | "EVIDENCE_REUSE"
  | "CHRONOLOGY_ANOMALY";

export interface SimulationResultDto {
  scenario: SimulationScenario;
  isSimulated: true;
  scenarioTitle: string;
  scenarioDescription: string;
  mutatedFields: {
    target: "CASE" | "EVIDENCE";
    identifier: string;
    field: string;
    originalValue: unknown;
    simulatedValue: unknown;
  }[];
  verification: {
    status: string;
    overallRisk: string;
    summary: string;
    calculatedValues: VerificationEngineResult["calculatedValues"];
    ruleResults: VerificationEngineResult["ruleResults"];
    findings: VerificationEngineResult["findings"];
    verifiedAt: Date;
  };
  proofGraph: ProofGraphDto;
}

export class SimulationService {
  /**
   * Deterministically runs an adversarial simulation against an isolated in-memory
   * snapshot of the case. ZERO production database records are modified.
   */
  public static async runSimulation(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
    scenario: SimulationScenario;
  }): Promise<SimulationResultDto> {
    const { userId, caseIdOrMongoId, scenario } = params;

    // 1. Fetch real production Case and Evidence documents
    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const realCase = await CaseModel.findOne(caseQuery);
    if (!realCase) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    const realEvidence = await EvidenceModel.find({ caseId: realCase._id }).sort({ createdAt: 1 });
    if (realEvidence.length === 0) {
      throw new AppError("No evidence files available to simulate.", 400, "NO_EVIDENCE");
    }

    // 2. Clone into pristine in-memory representations (never saved to MongoDB)
    const clonedCaseDoc: ICase = realCase.toObject() as ICase;
    const clonedEvidenceDocs: IEvidence[] = realEvidence.map((e) => e.toObject() as IEvidence);

    // Track simulated mutations for UI explainability & Proof Graph highlighting
    const mutatedFields: SimulationResultDto["mutatedFields"] = [];
    const simulatedNodeIds = new Set<string>();

    let scenarioTitle = "";
    let scenarioDescription = "";
    let simulatedCollisions:
      | {
          evidenceId: string;
          fileHash: string;
          collidingCaseId: string;
          collidingTransactionId: string;
          collidingEvidenceId: string;
          collidingUploadedAt: Date;
        }[]
      | undefined;

    // 3. Apply scenario-specific deterministic mutations
    switch (scenario) {
      case "WEIGHT_MISMATCH": {
        scenarioTitle = "Weight Mismatch";
        scenarioDescription =
          "Simulates physical scale readings that conflict with declared invoice quantity beyond tolerance threshold.";

        // Find scale evidence items
        const scaleItems = clonedEvidenceDocs.filter((e) => e.type === "SCALE_IMAGE");
        if (scaleItems.length > 0) {
          // Alter the first scale ticket to introduce a clear discrepancy
          const targetScale = scaleItems[0]!;
          const originalWeight = (targetScale.extraction.data?.["weight"] as number) ?? 184.6;
          // Substantially inflate weight to push total from ~555.6 kg to ~640 kg (+14% variance)
          const simulatedWeight = Math.round((originalWeight + 85.0) * 10) / 10;

          targetScale.extraction.data = {
            ...(targetScale.extraction.data || {}),
            weight: simulatedWeight,
          };

          mutatedFields.push({
            target: "EVIDENCE",
            identifier: targetScale.evidenceId,
            field: "weight",
            originalValue: `${originalWeight} kg`,
            simulatedValue: `${simulatedWeight} kg (Altered +85 kg)`,
          });

          simulatedNodeIds.add(`evidence-${targetScale.evidenceId}`);
          simulatedNodeIds.add(`fact-${targetScale.evidenceId}-weight`);
        }
        break;
      }

      case "INVOICE_MISMATCH": {
        scenarioTitle = "Invoice Quantity Mismatch";
        scenarioDescription =
          "Simulates an invoice declaring a quantity (620 kg) that conflicts with the physical scale measurements (555.6 kg).";

        // Mutate declared case quantity and invoice extraction quantity
        const originalClaimed = clonedCaseDoc.claimedQuantity;
        const simulatedClaimed = 620; // 620 kg vs 555.6 kg measured = ~10.71% variance

        clonedCaseDoc.claimedQuantity = simulatedClaimed;

        mutatedFields.push({
          target: "CASE",
          identifier: clonedCaseDoc.caseId,
          field: "claimedQuantity",
          originalValue: `${originalClaimed} kg`,
          simulatedValue: `${simulatedClaimed} kg (Simulated +${simulatedClaimed - originalClaimed} kg)`,
        });
        simulatedNodeIds.add(`case-${clonedCaseDoc.caseId}`);

        const invoiceDoc = clonedEvidenceDocs.find((e) => e.type === "INVOICE");
        if (invoiceDoc) {
          const originalInvQty = invoiceDoc.extraction.data?.["quantity"] ?? originalClaimed;
          invoiceDoc.extraction.data = {
            ...(invoiceDoc.extraction.data || {}),
            quantity: simulatedClaimed,
          };
          mutatedFields.push({
            target: "EVIDENCE",
            identifier: invoiceDoc.evidenceId,
            field: "quantity",
            originalValue: `${originalInvQty} kg`,
            simulatedValue: `${simulatedClaimed} kg`,
          });
          simulatedNodeIds.add(`evidence-${invoiceDoc.evidenceId}`);
          simulatedNodeIds.add(`fact-${invoiceDoc.evidenceId}-quantity`);
        }
        break;
      }

      case "TRANSACTION_MISMATCH": {
        scenarioTitle = "Transaction Identifier Mismatch";
        scenarioDescription =
          "Simulates a submitted document belonging to a foreign transaction ID (EW-999).";

        const docTarget =
          clonedEvidenceDocs.find((e) => e.type === "INVOICE" || e.type === "CERTIFICATE") ||
          clonedEvidenceDocs[0]!;

        const originalTx =
          (docTarget.extraction.data?.["transactionId"] as string) || clonedCaseDoc.transactionId;
        const simulatedTx = "EW-999";

        docTarget.extraction.data = {
          ...(docTarget.extraction.data || {}),
          transactionId: simulatedTx,
          invoiceNumber: "INV-999-ADVERSARIAL",
        };

        mutatedFields.push({
          target: "EVIDENCE",
          identifier: docTarget.evidenceId,
          field: "transactionId",
          originalValue: originalTx,
          simulatedValue: simulatedTx,
        });

        simulatedNodeIds.add(`evidence-${docTarget.evidenceId}`);
        simulatedNodeIds.add(`fact-${docTarget.evidenceId}-transactionId`);
        break;
      }

      case "EVIDENCE_INCONSISTENCY": {
        scenarioTitle = "Evidence Material Inconsistency";
        scenarioDescription =
          "Simulates conflicting material classification: PET Plastic Flakes vs HDPE Plastic Flakes.";

        const docTarget =
          clonedEvidenceDocs.find((e) => e.type === "INVOICE" || e.type === "CERTIFICATE") ||
          clonedEvidenceDocs[0]!;

        const originalMat =
          (docTarget.extraction.data?.["materialDescription"] as string) ||
          (docTarget.extraction.data?.["material"] as string) ||
          clonedCaseDoc.material;
        const simulatedMat = "HDPE Plastic Flakes";

        docTarget.extraction.data = {
          ...(docTarget.extraction.data || {}),
          materialDescription: simulatedMat,
          material: simulatedMat,
        };

        mutatedFields.push({
          target: "EVIDENCE",
          identifier: docTarget.evidenceId,
          field: "materialDescription",
          originalValue: originalMat,
          simulatedValue: simulatedMat,
        });

        simulatedNodeIds.add(`evidence-${docTarget.evidenceId}`);
        simulatedNodeIds.add(`fact-${docTarget.evidenceId}-materialDescription`);
        break;
      }

      case "EVIDENCE_REUSE": {
        scenarioTitle = "Cross-Case Evidence Reuse & Fingerprint Collision";
        scenarioDescription =
          "Simulates submitted weighbridge slip matching a document previously used in another transaction (PL-REC-8841).";

        const scaleTarget =
          clonedEvidenceDocs.find((e) => e.type === "SCALE_IMAGE") || clonedEvidenceDocs[0]!;

        const collisionHash = "8f4e2b10a9c735d4e11fa9b8821034fe7d0cba45112e8967019a3b65ef0218de";

        mutatedFields.push({
          target: "EVIDENCE",
          identifier: scaleTarget.evidenceId,
          field: "fileHash",
          originalValue: scaleTarget.file.fileHash || "Uncollided Fingerprint",
          simulatedValue: `Colliding Hash (${collisionHash.slice(0, 16)}...) from Transaction EW-089 (PL-REC-8841)`,
        });

        simulatedNodeIds.add(`evidence-${scaleTarget.evidenceId}`);

        // Provide simulated crossCaseCollisions directly to engine
        simulatedCollisions = [
          {
            evidenceId: scaleTarget.evidenceId,
            fileHash: collisionHash,
            collidingCaseId: "PL-REC-8841",
            collidingTransactionId: "EW-089",
            collidingEvidenceId: "EVD-PRIOR-441",
            collidingUploadedAt: new Date(Date.now() - 14 * 86400000), // 14 days ago
          },
        ];
        break;
      }

      case "CHRONOLOGY_ANOMALY": {
        scenarioTitle = "Chronological Impossibility";
        scenarioDescription =
          "Simulates physical weighbridge ticket dated 5 days after the final commercial invoice was issued.";

        const scaleTarget =
          clonedEvidenceDocs.find((e) => e.type === "SCALE_IMAGE") || clonedEvidenceDocs[0]!;

        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const futureDateStr = futureDate.toISOString().split("T")[0]!;

        const originalDate =
          (scaleTarget.extraction.data?.["ticketDate"] as string) ||
          (scaleTarget.extraction.data?.["date"] as string) ||
          "2026-09-28";

        scaleTarget.extraction.data = {
          ...(scaleTarget.extraction.data || {}),
          ticketDate: futureDateStr,
          date: futureDateStr,
        };

        mutatedFields.push({
          target: "EVIDENCE",
          identifier: scaleTarget.evidenceId,
          field: "ticketDate",
          originalValue: originalDate,
          simulatedValue: `${futureDateStr} (+5 days post-invoice)`,
        });

        simulatedNodeIds.add(`evidence-${scaleTarget.evidenceId}`);
        simulatedNodeIds.add(`fact-${scaleTarget.evidenceId}-date`);
        break;
      }
    }

    // 4. Run real VerificationEngine against the isolated context
    const engineResult = VerificationEngine.verify({
      caseDoc: clonedCaseDoc,
      evidenceDocs: clonedEvidenceDocs,
      crossCaseCollisions: typeof simulatedCollisions !== "undefined" ? simulatedCollisions : undefined,
    });

    // 5. Build synthetic verification and finding objects (without saving to MongoDB)
    const verificationSummary = {
      status: "COMPLETED",
      overallRisk: engineResult.overallRisk,
      summary: engineResult.summary,
      calculatedValues: engineResult.calculatedValues,
      ruleResults: engineResult.ruleResults,
      findings: engineResult.findings,
      verifiedAt: new Date(),
    };

    // 6. Generate the dynamic Proof Graph for this simulated context
    const simulatedVerificationDoc = {
      overallRisk: engineResult.overallRisk,
      calculatedValues: engineResult.calculatedValues,
      ruleResults: engineResult.ruleResults,
      summary: engineResult.summary,
      verifiedAt: new Date(),
    };

    const rawProofGraph = ProofGraphService.buildGraphFromData({
      caseDoc: clonedCaseDoc,
      evidenceDocs: clonedEvidenceDocs,
      verificationDoc: simulatedVerificationDoc as any,
      findingDocs: engineResult.findings as any,
    });

    // 7. Decorate simulated nodes and findings with SIMULATION indicators
    const decoratedNodes = rawProofGraph.nodes.map((node) => {
      const isSimulatedNode = simulatedNodeIds.has(node.id);
      if (isSimulatedNode) {
        return {
          ...node,
          isSimulated: true,
          category: `Simulated ${node.category || node.type}`,
          sublabel: `${node.sublabel || ""} [SIMULATED]`.trim(),
          metadata: {
            ...node.metadata,
            isSimulated: true,
            simulatedNote: "Adversarially altered in simulation sandbox",
          },
        };
      }
      return node;
    });

    logger.info("Adversarial simulation executed cleanly in-memory", {
      caseId: realCase.caseId,
      scenario,
      overallRisk: engineResult.overallRisk,
      mutatedFieldCount: mutatedFields.length,
      findingCount: engineResult.findings.length,
    });

    return {
      scenario,
      isSimulated: true,
      scenarioTitle,
      scenarioDescription,
      mutatedFields,
      verification: verificationSummary,
      proofGraph: {
        ...rawProofGraph,
        nodes: decoratedNodes,
      },
    };
  }
}
