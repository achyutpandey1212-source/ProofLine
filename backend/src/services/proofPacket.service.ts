import mongoose from "mongoose";
import PDFDocument from "pdfkit";
import { CaseModel, ICase } from "../models/case.model";
import { EvidenceModel, IEvidence } from "../models/evidence.model";
import { VerificationModel, IVerification } from "../models/verification.model";
import { FindingModel, IFinding } from "../models/finding.model";
import { ReviewDecisionModel, IReviewDecision } from "../models/reviewDecision.model";
import { UserModel, IUser } from "../models/user.model";
import { ProofGraphService, ProofGraphDto } from "./proofGraph.service";
import { AppError } from "../middleware/error.middleware";

export interface ProofPacketData {
  caseDoc: ICase;
  verificationDoc: IVerification;
  findingDocs: IFinding[];
  evidenceDocs: IEvidence[];
  proofGraph: ProofGraphDto;
  reviewDecisionDocs: IReviewDecision[];
  reviewerUser?: IUser | null;
  generatedAt: Date;
  version: string;
}

export class ProofPacketService {
  /**
   * Fetches all real production verification data for a case and assembles
   * the structured Proof Packet model without modifying the database.
   */
  public static async getProofPacketData(params: {
    userId: mongoose.Types.ObjectId;
    caseIdOrMongoId: string;
  }): Promise<ProofPacketData> {
    const { userId, caseIdOrMongoId } = params;

    const isObjectId = mongoose.Types.ObjectId.isValid(caseIdOrMongoId);
    const caseQuery = isObjectId
      ? { $or: [{ _id: caseIdOrMongoId }, { caseId: caseIdOrMongoId }], userId }
      : { caseId: caseIdOrMongoId, userId };

    const caseDoc = await CaseModel.findOne(caseQuery);
    if (!caseDoc) {
      throw new AppError("Verification case not found or access denied.", 404, "NOT_FOUND");
    }

    const [verificationDoc, evidenceDocs, findingDocs, reviewDecisionDocs] = await Promise.all([
      VerificationModel.findOne({ caseId: caseDoc._id }),
      EvidenceModel.find({ caseId: caseDoc._id }).sort({ createdAt: 1 }),
      FindingModel.find({ caseId: caseDoc._id }).sort({ createdAt: 1 }),
      ReviewDecisionModel.find({ caseId: caseDoc._id })
        .sort({ decidedAt: -1 })
        .populate("reviewedBy", "email name role"),
    ]);

    if (!verificationDoc || verificationDoc.status !== "COMPLETED") {
      throw new AppError(
        "Complete verification before generating a Proof Packet.",
        400,
        "VERIFICATION_NOT_COMPLETE"
      );
    }

    let reviewerUser: IUser | null = null;
    if (caseDoc.resolvedBy) {
      reviewerUser = await UserModel.findById(caseDoc.resolvedBy);
    }

    const proofGraph = ProofGraphService.buildGraphFromData({
      caseDoc,
      evidenceDocs,
      verificationDoc,
      findingDocs,
    });

    return {
      caseDoc,
      verificationDoc,
      findingDocs,
      evidenceDocs,
      proofGraph,
      reviewDecisionDocs,
      reviewerUser,
      generatedAt: new Date(),
      version: "1.0.0",
    };
  }

  /**
   * Generates a downloadable, professionally typeset PDF buffer (2–4 pages)
   * in the Proofline editorial aesthetic using pure vector layout.
   */
  public static async generateProofPacketPdf(data: ProofPacketData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margin: 40,
          info: {
            Title: `Proof Packet - ${data.caseDoc.transactionId}`,
            Author: "Proofline Verification Engine",
            Subject: "Deterministic Verification Audit Dossier",
            Keywords: "audit, verification, proof packet, provenance",
            CreationDate: data.generatedAt,
          },
          bufferPages: true,
        });

        const buffers: Buffer[] = [];
        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", (err) => reject(err));

        const colors = {
          bg: "#0B090B",
          cardBg: "#141215",
          border: "#28252A",
          textPrimary: "#F5F3F4",
          textSecondary: "#9E9A9F",
          accentOrange: "#FF6D29",
          accentOrangeLight: "#FFA776",
          emerald: "#10B981",
          emeraldBg: "#064E3B",
          red: "#EF4444",
          redBg: "#450A0A",
        };

        const drawPageHeader = (pageNumber: number, totalPages: number) => {
          doc.save();
          doc.fillColor(colors.accentOrange).fontSize(9).font("Helvetica-Bold")
            .text("PROOFLINE", 40, 30, { continued: true });
          doc.fillColor(colors.textSecondary).fontSize(8).font("Helvetica")
            .text(`  //  PROOF PACKET  //  CASE: ${data.caseDoc.transactionId}`, { align: "left" });

          doc.fillColor(colors.textSecondary).fontSize(8).font("Helvetica")
            .text(`Page ${pageNumber} of ${totalPages}`, 40, 30, { align: "right" });

          doc.strokeColor(colors.border).lineWidth(0.75)
            .moveTo(40, 44).lineTo(555, 44).stroke();
          doc.restore();
        };

        const drawPageFooter = () => {
          doc.save();
          doc.strokeColor(colors.border).lineWidth(0.75)
            .moveTo(40, 800).lineTo(555, 800).stroke();

          doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica")
            .text(
              `PROOFLINE AUDIT DOSSIER  •  Case ID: ${data.caseDoc.caseId}  •  Tx: ${data.caseDoc.transactionId}  •  Auth: Deterministic Integrity Layer`,
              40,
              806,
              { align: "left", width: 400 }
            );

          doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica")
            .text(
              `${data.generatedAt.toISOString().slice(0, 10)}  v${data.version}`,
              400,
              806,
              { align: "right", width: 155 }
            );
          doc.restore();
        };

        // ==========================================
        // PAGE 1: COVER, SUMMARY & RESULT METRICS
        // ==========================================

        // Top Brand Header Banner
        doc.rect(40, 40, 515, 68).fill(colors.cardBg);
        doc.rect(40, 40, 515, 68).strokeColor(colors.border).lineWidth(1).stroke();

        doc.fillColor(colors.accentOrange).fontSize(14).font("Helvetica-Bold")
          .text("PROOFLINE", 55, 54);
        doc.fillColor(colors.textSecondary).fontSize(9).font("Helvetica")
          .text("DETERMINISTIC EVIDENCE VERIFICATION PLATFORM", 55, 71);

        // Status pill on right of header
        const isVerified = data.verificationDoc.overallRisk === "LOW";
        const badgeColor = isVerified ? colors.emerald : colors.accentOrange;
        const badgeText = isVerified ? "VERIFIED / LOW RISK" : "REVIEW REQUIRED";

        doc.rect(400, 52, 140, 22).fill(isVerified ? "#092E20" : "#321609");
        doc.rect(400, 52, 140, 22).strokeColor(badgeColor).lineWidth(1).stroke();
        doc.fillColor(badgeColor).fontSize(8).font("Helvetica-Bold")
          .text(badgeText, 400, 59, { align: "center", width: 140 });

        // Document Title
        doc.fillColor(colors.accentOrange).fontSize(10).font("Helvetica-Bold")
          .text("PROOF PACKET", 40, 126);
        doc.fillColor(colors.textPrimary).fontSize(20).font("Helvetica-Bold")
          .text(`Verification Dossier: ${data.caseDoc.transactionId}`, 40, 140);

        doc.fillColor(colors.textSecondary).fontSize(9).font("Helvetica")
          .text(
            "This packet summarizes the evidence, verification rules, findings, and provenance supporting this verification decision.",
            40,
            168,
            { width: 515, lineGap: 3 }
          );

        // Metadata grid table
        doc.rect(40, 192, 515, 68).fill(colors.cardBg);
        doc.rect(40, 192, 515, 68).strokeColor(colors.border).lineWidth(0.75).stroke();

        const metaCol1 = 55;
        const metaCol2 = 220;
        const metaCol3 = 390;

        doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica")
          .text("CASE ID", metaCol1, 202)
          .text("TRANSACTION ID", metaCol2, 202)
          .text("ORGANIZATION / PARTNER", metaCol3, 202);

        doc.fillColor(colors.textPrimary).fontSize(9).font("Helvetica-Bold")
          .text(data.caseDoc.caseId, metaCol1, 212)
          .text(data.caseDoc.transactionId, metaCol2, 212)
          .text(data.caseDoc.partnerName, metaCol3, 212);

        doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica")
          .text("MATERIAL CLASSIFICATION", metaCol1, 230)
          .text("VERIFIED TIMESTAMP", metaCol2, 230)
          .text("AUDIT DISPOSITION", metaCol3, 230);

        doc.fillColor(colors.textPrimary).fontSize(9).font("Helvetica-Bold")
          .text(data.caseDoc.material, metaCol1, 240)
          .text(data.verificationDoc.verifiedAt?.toISOString().slice(0, 19).replace("T", " ") || "—", metaCol2, 240)
          .text(isVerified ? "CLEARED" : "FLAGGED FOR REVIEW", metaCol3, 240);

        // SECTION B: VERIFICATION RESULT METRICS
        doc.fillColor(colors.textPrimary).fontSize(11).font("Helvetica-Bold")
          .text("SECTION 1: VERIFICATION RESULT", 40, 278);

        // 4 Key metrics cards
        const cardW = 122;
        const cardH = 64;
        const cardY = 296;

        const claimed = data.verificationDoc.calculatedValues?.claimedWeight ?? data.caseDoc.claimedQuantity;
        const measured = data.verificationDoc.calculatedValues?.measuredWeight ?? "—";
        const diff = data.verificationDoc.calculatedValues?.differenceWeight !== undefined
          ? Math.abs(data.verificationDoc.calculatedValues.differenceWeight)
          : "—";
        const variance = data.verificationDoc.calculatedValues?.variancePercentage ?? 0;
        const unit = data.verificationDoc.calculatedValues?.unit || data.caseDoc.unit || "kg";

        const metrics = [
          { label: "CLAIMED QUANTITY", val: `${claimed} ${unit}`, sub: "Invoice declaration" },
          { label: "MEASURED QUANTITY", val: `${measured} ${unit}`, sub: "Physical weighbridge sum" },
          { label: "ABSOLUTE DIFFERENCE", val: `${diff} ${unit}`, sub: "Variance magnitude" },
          { label: "RECONCILIATION VARIANCE", val: `${variance}%`, sub: "Configured tolerance: 2.0%" },
        ];

        metrics.forEach((m, i) => {
          const cx = 40 + i * (cardW + 9);
          doc.rect(cx, cardY, cardW, cardH).fill(colors.cardBg);
          doc.rect(cx, cardY, cardW, cardH).strokeColor(colors.border).lineWidth(0.75).stroke();

          doc.fillColor(colors.textSecondary).fontSize(6.5).font("Helvetica")
            .text(m.label, cx + 8, cardY + 9, { width: cardW - 16 });

          const valColor = i === 3
            ? variance <= 2.0 ? colors.emerald : colors.accentOrange
            : colors.textPrimary;

          doc.fillColor(valColor).fontSize(12).font("Helvetica-Bold")
            .text(String(m.val), cx + 8, cardY + 23, { width: cardW - 16 });

          doc.fillColor(colors.textSecondary).fontSize(6.5).font("Helvetica")
            .text(m.sub, cx + 8, cardY + 47, { width: cardW - 16 });
        });

        // SECTION C: VERIFICATION FINDINGS
        doc.fillColor(colors.textPrimary).fontSize(11).font("Helvetica-Bold")
          .text("SECTION 2: VERIFICATION FINDINGS & DISCREPANCIES", 40, 380);

        let curY = 398;
        if (data.findingDocs.length === 0) {
          doc.rect(40, curY, 515, 52).fill(colors.cardBg);
          doc.rect(40, curY, 515, 52).strokeColor("#065F46").lineWidth(0.75).stroke();

          doc.fillColor(colors.emerald).fontSize(9).font("Helvetica-Bold")
            .text("NO DISCREPANCIES DETECTED", 55, curY + 12);
          doc.fillColor(colors.textSecondary).fontSize(8).font("Helvetica")
            .text(
              "All physical measurements reconcile within the declared 2.0% tolerance limit. Partner entities, materials, and transaction identifiers match completely across submitted evidence.",
              55,
              curY + 26,
              { width: 485, lineGap: 2 }
            );
          curY += 66;
        } else {
          for (const f of data.findingDocs) {
            const fColor = f.severity === "HIGH" ? colors.red : colors.accentOrange;
            doc.rect(40, curY, 515, 58).fill(colors.cardBg);
            doc.rect(40, curY, 515, 58).strokeColor(fColor).lineWidth(0.75).stroke();

            doc.fillColor(fColor).fontSize(8.5).font("Helvetica-Bold")
              .text(`[${f.severity}]  ${f.title}`, 55, curY + 9, { continued: true });
            doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
              .text(`  (Rule: ${f.ruleId})`);

            doc.fillColor(colors.textPrimary).fontSize(8).font("Helvetica")
              .text(f.description, 55, curY + 23, { width: 485, lineGap: 1.5 });

            if (f.recommendedAction) {
              doc.fillColor(colors.accentOrangeLight).fontSize(7.5).font("Helvetica")
                .text(`Recommended Action: ${f.recommendedAction}`, 55, curY + 43, { width: 485 });
            }
            curY += 68;
          }
        }

        // SECTION D: EVIDENCE REGISTER
        doc.fillColor(colors.textPrimary).fontSize(11).font("Helvetica-Bold")
          .text("SECTION 3: EVIDENCE REGISTER", 40, curY + 12);
        curY += 30;

        // Table Header
        doc.rect(40, curY, 515, 18).fill(colors.border);
        doc.fillColor(colors.textPrimary).fontSize(7.5).font("Helvetica-Bold")
          .text("EVIDENCE ID", 48, curY + 5)
          .text("CLASSIFICATION", 130, curY + 5)
          .text("FILENAME", 230, curY + 5)
          .text("STATUS", 365, curY + 5)
          .text("EXTRACTED FACT", 435, curY + 5);
        curY += 18;

        data.evidenceDocs.forEach((ev, idx) => {
          doc.rect(40, curY, 515, 20).fill(idx % 2 === 0 ? colors.cardBg : "#100E11");
          doc.rect(40, curY, 515, 20).strokeColor(colors.border).lineWidth(0.5).stroke();

          // Formatted measurement
          let factStr = "—";
          const dataObj = ev.extraction?.data as Record<string, unknown> | undefined;
          if (dataObj) {
            if (typeof dataObj["weight"] === "number") factStr = `${dataObj["weight"]} kg`;
            else if (typeof dataObj["quantity"] === "number") factStr = `${dataObj["quantity"]} kg`;
            else if (dataObj["transactionId"]) factStr = `Tx: ${String(dataObj["transactionId"])}`;
          } else if ((ev as any).extraction?.weight?.value) {
            factStr = `${(ev as any).extraction.weight.value} ${(ev as any).extraction.weight.unit || "kg"}`;
          }

          const evId = ev.evidenceId || String(ev._id).slice(-8);
          const evType = ev.type || (ev as any).documentType || "DOCUMENT";
          const fileName = ev.file?.name || (ev as any).fileName || "evidence-attachment";

          doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
            .text(evId, 48, curY + 6)
            .text(evType, 130, curY + 6);

          doc.fillColor(colors.textPrimary).fontSize(7.5).font("Helvetica")
            .text(fileName.length > 24 ? fileName.slice(0, 22) + "..." : fileName, 230, curY + 6);

          doc.fillColor(colors.emerald).fontSize(7.5).font("Helvetica-Bold")
            .text(ev.status || "EXTRACTED", 365, curY + 6);

          doc.fillColor(colors.textPrimary).fontSize(7.5).font("Helvetica-Bold")
            .text(factStr, 435, curY + 6);

          curY += 20;
        });

        // ==========================================
        // PAGE 2: VERIFICATION RULES & PROVENANCE
        // ==========================================
        doc.addPage();
        curY = 60;

        // SECTION E: VERIFICATION RULES
        doc.fillColor(colors.textPrimary).fontSize(11).font("Helvetica-Bold")
          .text("SECTION 4: EVALUATED VERIFICATION RULES", 40, curY);
        curY += 18;

        const ruleResults = data.verificationDoc.ruleResults || [];
        ruleResults.forEach((r) => {
          const pass = r.status === "PASS";
          const statusColor = pass ? colors.emerald : r.status === "FAIL" ? colors.red : colors.accentOrange;

          doc.rect(40, curY, 515, 34).fill(colors.cardBg);
          doc.rect(40, curY, 515, 34).strokeColor(colors.border).lineWidth(0.5).stroke();

          const ruleName = r.ruleId
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c: string) => c.toUpperCase());

          doc.fillColor(colors.textPrimary).fontSize(8.5).font("Helvetica-Bold")
            .text(ruleName, 52, curY + 7);

          doc.rect(480, curY + 7, 60, 14).fill(pass ? "#064E3B" : "#451A03");
          doc.fillColor(statusColor).fontSize(7.5).font("Helvetica-Bold")
            .text(r.status, 480, curY + 10, { align: "center", width: 60 });

          doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
            .text(r.message, 52, curY + 20, { width: 420 });

          curY += 38;
        });

        curY += 14;

        // SECTION F: EVIDENCE -> DECISION PROVENANCE
        doc.fillColor(colors.textPrimary).fontSize(11).font("Helvetica-Bold")
          .text("SECTION 5: EVIDENCE-TO-DECISION PROVENANCE CHAIN", 40, curY);
        doc.fillColor(colors.textSecondary).fontSize(8).font("Helvetica")
          .text(
            "Linear chain of custody tracing submitted physical items to final compliance status via the Proof Graph.",
            40,
            curY + 14
          );
        curY += 30;

        // Build linear provenance paths from proofGraph
        data.evidenceDocs.forEach((ev) => {
          const dataObj = ev.extraction?.data as Record<string, unknown> | undefined;
          let factDetail = "Recorded Document";
          if (dataObj?.weight) factDetail = `${dataObj.weight} kg`;
          else if (dataObj?.quantity) factDetail = `${dataObj.quantity} kg`;
          else if (dataObj?.transactionId) factDetail = `Tx: ${dataObj.transactionId}`;
          else if ((ev as any).extraction?.weight?.value) factDetail = `${(ev as any).extraction.weight.value} ${(ev as any).extraction.weight.unit || "kg"}`;

          const evId = ev.evidenceId || String(ev._id).slice(-8);
          const evType = ev.type || (ev as any).documentType || "DOCUMENT";
          const fileName = ev.file?.name || (ev as any).fileName || "evidence-attachment";

          const relatedRules = ruleResults
            .filter((r) => r.evidenceIds?.includes(evId))
            .map((r) => r.ruleId.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase()));

          const ruleStr = relatedRules.length > 0 ? relatedRules.join(", ") : "Evidence Completeness";

          doc.rect(40, curY, 515, 24).fill(colors.cardBg);
          doc.rect(40, curY, 515, 24).strokeColor(colors.border).lineWidth(0.5).stroke();

          doc.fillColor(colors.accentOrange).fontSize(7.5).font("Helvetica-Bold")
            .text(evType, 50, curY + 7, { continued: true });
          doc.fillColor(colors.textSecondary).font("Helvetica")
            .text(` (${fileName.slice(0, 20)})   →   `, { continued: true });

          doc.fillColor(colors.textPrimary).font("Helvetica-Bold")
            .text(factDetail, { continued: true });
          doc.fillColor(colors.textSecondary).font("Helvetica")
            .text(`   →   ${ruleStr}   →   `, { continued: true });

          doc.fillColor(isVerified ? colors.emerald : colors.accentOrange).font("Helvetica-Bold")
            .text(isVerified ? "VERIFIED" : "REVIEW REQUIRED");

          curY += 28;
        });

        curY += 14;

        // SECTION G: EVIDENCE REFERENCES
        doc.fillColor(colors.textPrimary).fontSize(11).font("Helvetica-Bold")
          .text("SECTION 6: EVIDENCE REPOSITORY REFERENCES", 40, curY);
        curY += 18;

        data.evidenceDocs.forEach((ev) => {
          const evId = ev.evidenceId || String(ev._id).slice(-8);
          const evType = ev.type || (ev as any).documentType || "DOCUMENT";
          const fileName = ev.file?.name || (ev as any).fileName || "evidence-attachment";
          const safeUrl = ev.file?.url ? ev.file.url : ((ev as any).s3Key || "Secure Vault Stored");

          doc.rect(40, curY, 515, 26).fill(colors.cardBg);
          doc.rect(40, curY, 515, 26).strokeColor(colors.border).lineWidth(0.5).stroke();

          doc.fillColor(colors.textPrimary).fontSize(8).font("Helvetica-Bold")
            .text(evId, 50, curY + 5, { continued: true });
          doc.fillColor(colors.textSecondary).font("Helvetica")
            .text(`  •  ${evType}  •  ${fileName}`);

          doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica")
            .text(`Asset Reference: ${safeUrl.slice(0, 95)}`, 50, curY + 15);

          curY += 30;
        });

        // ==========================================
        // SECTION 7: HUMAN REVIEW & RESOLUTION AUDIT
        // ==========================================
        if (curY > 600) {
          doc.addPage();
          curY = 55;
        } else {
          curY += 16;
        }

        doc.fillColor(colors.textPrimary).fontSize(11).font("Helvetica-Bold")
          .text("SECTION 7: HUMAN REVIEW & RESOLUTION DECISION", 40, curY);
        doc.fillColor(colors.textSecondary).fontSize(8).font("Helvetica")
          .text(
            "Distinct human oversight layer recording reviewer actions, notes, and institutional disposition.",
            40,
            curY + 14
          );
        curY += 30;

        const resolutionState = data.caseDoc.resolutionState || "PENDING_REVIEW";
        const resColor =
          resolutionState === "APPROVED"
            ? colors.emerald
            : resolutionState === "REJECTED"
            ? "#EF4444"
            : resolutionState === "CLARIFICATION_REQUESTED"
            ? "#EAB308"
            : colors.textSecondary;

        // Current resolution card
        doc.rect(40, curY, 515, 68).fill(colors.cardBg);
        doc.rect(40, curY, 515, 68).strokeColor(colors.border).lineWidth(1).stroke();

        doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
          .text("CURRENT RESOLUTION STATUS", 55, curY + 10)
          .text("REVIEWER IDENTITY", 220, curY + 10)
          .text("DECISION RECORDED AT", 390, curY + 10);

        doc.fillColor(resColor).fontSize(11).font("Helvetica-Bold")
          .text(resolutionState.replace(/_/g, " "), 55, curY + 22);

        const reviewerEmail = data.reviewerUser?.email || "Pending Assignment";
        doc.fillColor(colors.textPrimary).fontSize(9).font("Helvetica-Bold")
          .text(reviewerEmail, 220, curY + 24)
          .text(data.caseDoc.resolvedAt ? new Date(data.caseDoc.resolvedAt).toISOString().slice(0, 19).replace("T", " ") : "Awaiting Review", 390, curY + 24);

        if (data.caseDoc.resolutionNote) {
          doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
            .text("REVIEWER NOTE:", 55, curY + 42, { continued: true });
          doc.fillColor(colors.textPrimary).font("Helvetica-Oblique")
            .text(` "${data.caseDoc.resolutionNote}"`);
        } else {
          doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica-Oblique")
            .text("No reviewer notes attached to this disposition.", 55, curY + 44);
        }

        curY += 76;

        // Decision history log if multiple decisions exist
        if (data.reviewDecisionDocs && data.reviewDecisionDocs.length > 0) {
          doc.fillColor(colors.textSecondary).fontSize(8.5).font("Helvetica-Bold")
            .text("REVIEW DECISION HISTORY AUDIT TRAIL", 40, curY);
          curY += 14;

          data.reviewDecisionDocs.slice(0, 4).forEach((d) => {
            const dColor =
              d.decision === "APPROVED"
                ? colors.emerald
                : d.decision === "REJECTED"
                ? "#EF4444"
                : d.decision === "CLARIFICATION_REQUESTED"
                ? "#EAB308"
                : colors.textSecondary;

            doc.rect(40, curY, 515, 26).fill(colors.cardBg);
            doc.rect(40, curY, 515, 26).strokeColor(colors.border).lineWidth(0.5).stroke();

            doc.fillColor(dColor).fontSize(8).font("Helvetica-Bold")
              .text(d.decision.replace(/_/g, " "), 50, curY + 5, { continued: true });
            doc.fillColor(colors.textSecondary).font("Helvetica")
              .text(`  •  ${(d as any).reviewedBy?.email || "Reviewer"}  •  ${new Date(d.decidedAt).toISOString().slice(0, 16).replace("T", " ")}`);

            if (d.note) {
              doc.fillColor(colors.textPrimary).fontSize(7.5).font("Helvetica-Oblique")
                .text(`"${d.note}"`, 50, curY + 16, { width: 490 });
            }

            curY += 30;
          });
        }

        // Apply headers & footers across all buffered pages
        const pages = doc.bufferedPageRange();
        for (let i = 0; i < pages.count; i++) {
          doc.switchToPage(i);
          drawPageHeader(i + 1, pages.count);
          drawPageFooter();
        }

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
