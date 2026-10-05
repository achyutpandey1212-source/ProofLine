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
          margins: { top: 44, bottom: 44, left: 44, right: 44 },
          bufferPages: true,
          info: {
            Title: `Proof Packet - ${data.caseDoc.transactionId}`,
            Author: "Proofline Cryptographic Audit Platform",
            Subject: `Deterministic Verification Dossier for ${data.caseDoc.transactionId}`,
            Keywords: "audit, verification, reconciliation, compliance",
          },
        });

        const buffers: Buffer[] = [];
        doc.on("data", (chunk) => buffers.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(buffers)));
        doc.on("error", (err) => reject(err));

        // Clean, institutional legal & compliance color palette (White Paper)
        const colors = {
          bg: "#FFFFFF",
          cardBg: "#FAFAFA",
          cardBgAlt: "#F4F4F5",
          border: "#E4E4E7",
          borderDark: "#D4D4D8",
          textPrimary: "#18181B",     // Deep charcoal / nearly black
          textSecondary: "#52525B",   // Neutral graphite
          textMuted: "#71717A",       // Readable grey
          accent: "#C2410C",          // Institutional terracotta / burnt-earth
          emeraldText: "#166534",     // Dark readable green
          emeraldBg: "#DCFCE7",
          emeraldBorder: "#86EFAC",
          redText: "#991B1B",         // Dark readable red
          redBg: "#FEE2E2",
          redBorder: "#FCA5A5",
          amberText: "#854D0E",
          amberBg: "#FEF9C3",
          amberBorder: "#FDE047",
        };

        const drawPageHeader = (pageNumber: number, totalPages: number) => {
          doc.save();
          // Top accent line
          doc.rect(44, 30, 507, 1.5).fill(colors.textPrimary);

          doc.fillColor(colors.accent).fontSize(8).font("Helvetica-Bold")
            .text("PROOFLINE", 44, 36, { continued: true });
          doc.fillColor(colors.textMuted).fontSize(8).font("Helvetica")
            .text(`  |  VERIFICATION DOSSIER  |  TRANSACTION ${data.caseDoc.transactionId}`, { align: "left" });

          doc.fillColor(colors.textMuted).fontSize(8).font("Helvetica")
            .text(`Page ${pageNumber} of ${totalPages}`, 44, 36, { align: "right" });

          doc.restore();
        };

        const drawPageFooter = () => {
          doc.save();
          doc.rect(44, 792, 507, 0.75).fill(colors.border);

          const genDate = data.generatedAt.toISOString().slice(0, 19).replace("T", " ") + " UTC";
          doc.fillColor(colors.textMuted).fontSize(7).font("Helvetica")
            .text(
              `CONFIDENTIAL AUDIT ARTIFACT  �  ISSUED ${genDate}  �  CASE ID: ${data.caseDoc.caseId}`,
              44,
              800,
              { align: "left" }
            );

          doc.fillColor(colors.textMuted).fontSize(7).font("Helvetica")
            .text(`SPECIFICATION: PROOFLINE-${data.version}`, 44, 800, { align: "right" });

          doc.restore();
        };

        const isVerified =
          data.verificationDoc.status === "COMPLETED" &&
          (data.verificationDoc.overallRisk === "LOW" ||
            data.caseDoc.status === "VERIFICATION_COMPLETE");

        // ==========================================
        // PAGE 1: EXECUTIVE SUMMARY & EVIDENCE TABLE
        // ==========================================
        doc.rect(0, 0, 595.28, 841.89).fill(colors.bg);

        // Header Title Block
        doc.fillColor(colors.textPrimary).fontSize(20).font("Helvetica-Bold")
          .text("Transaction Verification Dossier", 44, 62);
        doc.fillColor(colors.textSecondary).fontSize(9).font("Helvetica")
          .text(
            "Cryptographic reconciliation of commercial claims against physical weighbridge telemetry and supporting records.",
            44,
            88
          );

        // Status Banner (Clean Institutional Pill)
        const bannerBg = isVerified ? colors.emeraldBg : colors.amberBg;
        const bannerBorder = isVerified ? colors.emeraldBorder : colors.amberBorder;
        const bannerText = isVerified ? colors.emeraldText : colors.amberText;

        doc.rect(44, 110, 507, 44).fill(bannerBg);
        doc.rect(44, 110, 507, 44).strokeColor(bannerBorder).lineWidth(1).stroke();

        doc.fillColor(bannerText).fontSize(11).font("Helvetica-Bold")
          .text(isVerified ? "STATUS: VERIFIED (LOW RISK)" : "STATUS: REVIEW REQUIRED (DISCREPANCY DETECTED)", 56, 120);

        doc.fillColor(colors.textSecondary).fontSize(8).font("Helvetica")
          .text(
            data.verificationDoc.summary ||
              (isVerified
                ? "Physical measurements agree with invoiced declarations within the configured 2.0% variance threshold."
                : "One or more cross-document discrepancies detected requiring authorized compliance review."),
            56,
            135,
            { width: 480 }
          );

        // Transaction Meta Table
        doc.rect(44, 166, 507, 60).fill(colors.cardBg);
        doc.rect(44, 166, 507, 60).strokeColor(colors.border).lineWidth(1).stroke();

        doc.fillColor(colors.textMuted).fontSize(7).font("Helvetica-Bold")
          .text("CASE IDENTIFIER", 56, 174)
          .text("TRANSACTION ID", 215, 174)
          .text("COUNTERPARTY / PARTNER", 375, 174);

        doc.fillColor(colors.textPrimary).fontSize(8.5).font("Helvetica")
          .text(data.caseDoc.caseId, 56, 184)
          .text(data.caseDoc.transactionId, 215, 184)
          .text(data.caseDoc.partnerName, 375, 184);

        doc.fillColor(colors.textMuted).fontSize(7).font("Helvetica-Bold")
          .text("MATERIAL SPECIFICATION", 56, 202)
          .text("VERIFIED TIMESTAMP", 215, 202)
          .text("ORGANIZATION", 375, 202);

        doc.fillColor(colors.textPrimary).fontSize(8.5).font("Helvetica")
          .text(data.caseDoc.material, 56, 212)
          .text(data.verificationDoc.verifiedAt?.toISOString().slice(0, 19).replace("T", " ") || "�", 215, 212)
          .text(data.caseDoc.organization || "�", 375, 212);

        // SECTION 1: KEY RECONCILIATION METRICS
        doc.fillColor(colors.textPrimary).fontSize(10.5).font("Helvetica-Bold")
          .text("1. Mass-Balance & Tolerance Reconciliation", 44, 242);

        const cardW = 120;
        const cardH = 54;
        const cardY = 258;

        const claimed = data.verificationDoc.calculatedValues?.claimedWeight ?? data.caseDoc.claimedQuantity;
        const measured = data.verificationDoc.calculatedValues?.measuredWeight ?? "�";
        const diff = data.verificationDoc.calculatedValues?.differenceWeight !== undefined
          ? Math.abs(data.verificationDoc.calculatedValues.differenceWeight)
          : "�";
        const variance = data.verificationDoc.calculatedValues?.variancePercentage ?? 0;
        const unit = data.verificationDoc.calculatedValues?.unit || data.caseDoc.unit || "kg";

        const metrics = [
          { label: "CLAIMED QUANTITY", val: `${claimed} ${unit}`, sub: "Invoice declaration" },
          { label: "MEASURED SUM", val: `${measured} ${unit}`, sub: "Weighbridge total" },
          { label: "ABSOLUTE VARIANCE", val: `${diff} ${unit}`, sub: "Measurement difference" },
          { label: "VARIANCE PERCENT", val: `${variance}%`, sub: "Configured limit: 2.0%" },
        ];

        metrics.forEach((m, i) => {
          const cx = 44 + i * (cardW + 9);
          doc.rect(cx, cardY, cardW, cardH).fill(colors.cardBg);
          doc.rect(cx, cardY, cardW, cardH).strokeColor(colors.border).lineWidth(1).stroke();

          doc.fillColor(colors.textMuted).fontSize(6.5).font("Helvetica-Bold")
            .text(m.label, cx + 8, cardY + 7);

          const valColor = i === 3
            ? variance <= 2.0 ? colors.emeraldText : colors.redText
            : colors.textPrimary;

          doc.fillColor(valColor).fontSize(11).font("Helvetica-Bold")
            .text(String(m.val), cx + 8, cardY + 20);

          doc.fillColor(colors.textSecondary).fontSize(6.5).font("Helvetica")
            .text(m.sub, cx + 8, cardY + 38);
        });

        // SECTION 2: VERIFICATION FINDINGS
        let curY = 328;
        doc.fillColor(colors.textPrimary).fontSize(10.5).font("Helvetica-Bold")
          .text("2. Verification Findings & Exceptions", 44, curY);
        curY += 16;

        if (data.findingDocs.length === 0) {
          doc.rect(44, curY, 507, 40).fill(colors.emeraldBg);
          doc.rect(44, curY, 507, 40).strokeColor(colors.emeraldBorder).lineWidth(1).stroke();

          doc.fillColor(colors.emeraldText).fontSize(8.5).font("Helvetica-Bold")
            .text("No Discrepancies Detected", 56, curY + 9);
          doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
            .text(
              "All physical measurements reconcile within 2.0% tolerance. Entities, dates, and materials agree completely across submitted records.",
              56,
              curY + 22,
              { width: 480 }
            );
          curY += 50;
        } else {
          for (const f of data.findingDocs) {
            const isHigh = f.severity === "HIGH";
            const fBg = isHigh ? colors.redBg : colors.amberBg;
            const fBorder = isHigh ? colors.redBorder : colors.amberBorder;
            const fText = isHigh ? colors.redText : colors.amberText;

            doc.rect(44, curY, 507, 44).fill(colors.cardBg);
            doc.rect(44, curY, 507, 44).strokeColor(colors.border).lineWidth(1).stroke();

            // Severity pill
            doc.rect(54, curY + 7, 40, 12).fill(fBg);
            doc.rect(54, curY + 7, 40, 12).strokeColor(fBorder).lineWidth(0.5).stroke();
            doc.fillColor(fText).fontSize(6.5).font("Helvetica-Bold")
              .text(f.severity, 54, curY + 9.5, { align: "center", width: 40 });

            doc.fillColor(colors.textPrimary).fontSize(8).font("Helvetica-Bold")
              .text(f.title, 102, curY + 8);

            doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
              .text(f.description, 54, curY + 24, { width: 485 });

            curY += 50;
          }
        }

        // SECTION 3: EVIDENCE REGISTER
        doc.fillColor(colors.textPrimary).fontSize(10.5).font("Helvetica-Bold")
          .text("3. Evidence Register & Facts", 44, curY + 6);
        curY += 22;

        // Table Header
        doc.rect(44, curY, 507, 18).fill(colors.cardBgAlt);
        doc.rect(44, curY, 507, 18).strokeColor(colors.border).lineWidth(1).stroke();

        doc.fillColor(colors.textPrimary).fontSize(7).font("Helvetica-Bold")
          .text("EVIDENCE ID", 52, curY + 5.5)
          .text("CLASSIFICATION", 135, curY + 5.5)
          .text("FILE NAME", 240, curY + 5.5)
          .text("STATUS", 375, curY + 5.5)
          .text("EXTRACTED MEASUREMENT", 440, curY + 5.5);
        curY += 18;

        data.evidenceDocs.forEach((ev, idx) => {
          doc.rect(44, curY, 507, 19).fill(idx % 2 === 0 ? colors.bg : colors.cardBg);
          doc.rect(44, curY, 507, 19).strokeColor(colors.border).lineWidth(0.5).stroke();

          let factStr = "�";
          const dataObj = ev.extraction?.data as Record<string, unknown> | undefined;
          if (dataObj) {
            if (typeof dataObj["weight"] === "number") factStr = `${dataObj["weight"]} kg`;
            else if (typeof dataObj["quantity"] === "number") factStr = `${dataObj["quantity"]} kg`;
            else if (dataObj["transactionId"]) factStr = `Tx: ${String(dataObj["transactionId"])}`;
          }

          const evId = ev.evidenceId || String(ev._id).slice(-8);
          const evType = ev.type || "DOCUMENT";
          const fileName = ev.file?.name || "evidence-attachment";

          doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica")
            .text(evId, 52, curY + 5.5)
            .text(evType, 135, curY + 5.5);

          doc.fillColor(colors.textPrimary).fontSize(7).font("Helvetica")
            .text(fileName.length > 25 ? fileName.slice(0, 23) + "..." : fileName, 240, curY + 5.5);

          doc.fillColor(colors.emeraldText).fontSize(7).font("Helvetica-Bold")
            .text("EXTRACTED", 375, curY + 5.5);

          doc.fillColor(colors.textPrimary).fontSize(7).font("Helvetica-Bold")
            .text(factStr, 440, curY + 5.5);

          curY += 19;
        });

        // ==========================================
        // PAGE 2: EVALUATED RULES & AUDIT PROVENANCE
        // ==========================================
        doc.addPage();
        curY = 55;

        // SECTION 4: EVALUATED RULES
        doc.fillColor(colors.textPrimary).fontSize(10.5).font("Helvetica-Bold")
          .text("4. Evaluated Verification Rules", 44, curY);
        doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
          .text("Deterministic rule results executed against extracted document parameters.", 44, curY + 13);
        curY += 28;

        const ruleResults = data.verificationDoc.ruleResults || [];
        ruleResults.forEach((r) => {
          const pass = r.status === "PASS";
          const pillBg = pass ? colors.emeraldBg : colors.redBg;
          const pillBorder = pass ? colors.emeraldBorder : colors.redBorder;
          const pillText = pass ? colors.emeraldText : colors.redText;

          doc.rect(44, curY, 507, 30).fill(colors.cardBg);
          doc.rect(44, curY, 507, 30).strokeColor(colors.border).lineWidth(1).stroke();

          const ruleName = r.ruleId
            .replace(/_/g, " ")
            .toLowerCase()
            .replace(/\b\w/g, (c: string) => c.toUpperCase());

          doc.fillColor(colors.textPrimary).fontSize(8).font("Helvetica-Bold")
            .text(ruleName, 54, curY + 6);

          // Status Badge
          doc.rect(485, curY + 6, 52, 14).fill(pillBg);
          doc.rect(485, curY + 6, 52, 14).strokeColor(pillBorder).lineWidth(0.5).stroke();
          doc.fillColor(pillText).fontSize(7).font("Helvetica-Bold")
            .text(r.status, 485, curY + 9, { align: "center", width: 52 });

          doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica")
            .text(r.message, 54, curY + 18, { width: 420 });

          curY += 34;
        });

        curY += 12;

        // SECTION 5: EVIDENCE PROVENANCE PATHS
        doc.fillColor(colors.textPrimary).fontSize(10.5).font("Helvetica-Bold")
          .text("5. Evidence Provenance & Audit Trail", 44, curY);
        doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
          .text("Traceable graph path from physical records to final disposition.", 44, curY + 13);
        curY += 28;

        data.evidenceDocs.forEach((ev) => {
          const dataObj = ev.extraction?.data as Record<string, unknown> | undefined;
          let factDetail = "Document";
          if (dataObj?.weight) factDetail = `${dataObj.weight} kg`;
          else if (dataObj?.quantity) factDetail = `${dataObj.quantity} kg`;
          else if (dataObj?.transactionId) factDetail = `Tx: ${dataObj.transactionId}`;

          // unused evId removed
          const evType = ev.type || "DOCUMENT";
          const fileName = ev.file?.name || "evidence";

          doc.rect(44, curY, 507, 20).fill(colors.cardBg);
          doc.rect(44, curY, 507, 20).strokeColor(colors.border).lineWidth(0.5).stroke();

          doc.fillColor(colors.textPrimary).fontSize(7).font("Helvetica-Bold")
            .text(evType, 52, curY + 6, { continued: true });
          doc.fillColor(colors.textMuted).font("Helvetica")
            .text(` (${fileName.slice(0, 18)})   ?   `, { continued: true });

          doc.fillColor(colors.textPrimary).font("Helvetica-Bold")
            .text(factDetail, { continued: true });
          doc.fillColor(colors.textMuted).font("Helvetica")
            .text("   ?   Tolerance & Reconciliation   ?   ", { continued: true });

          doc.fillColor(isVerified ? colors.emeraldText : colors.amberText).font("Helvetica-Bold")
            .text(isVerified ? "CLEARED" : "REVIEW REQUIRED");

          curY += 23;
        });

        curY += 12;

        // SECTION 6: ASSET STORAGE INTEGRITY
        doc.fillColor(colors.textPrimary).fontSize(10.5).font("Helvetica-Bold")
          .text("6. Immutable Asset Storage References", 44, curY);
        curY += 18;

        data.evidenceDocs.forEach((ev) => {
          const fileUrl = ev.file?.url || "Internal Proofline Encrypted Store";
          doc.rect(44, curY, 507, 18).fill(colors.cardBg);
          doc.rect(44, curY, 507, 18).strokeColor(colors.border).lineWidth(0.5).stroke();

          doc.fillColor(colors.textPrimary).fontSize(7).font("Helvetica-Bold")
            .text(`${ev.evidenceId || "EVD"} � ${ev.type}:`, 52, curY + 5.5, { continued: true });
          doc.fillColor(colors.textSecondary).font("Helvetica")
            .text(`  ${fileUrl.slice(0, 75)}${fileUrl.length > 75 ? "..." : ""}`);

          curY += 21;
        });

        // ==========================================
        // PAGE 3: HUMAN REVIEW & INSTITUTIONAL SIGN-OFF
        // ==========================================
        doc.addPage();
        curY = 55;

        doc.fillColor(colors.textPrimary).fontSize(10.5).font("Helvetica-Bold")
          .text("7. Human Review & Resolution Disposition", 44, curY);
        doc.fillColor(colors.textSecondary).fontSize(7.5).font("Helvetica")
          .text("Authorized compliance officer sign-off separate from algorithmic verification results.", 44, curY + 13);
        curY += 28;

        const resolutionState = data.caseDoc.resolutionState || "PENDING_REVIEW";
        const isApproved = resolutionState === "APPROVED";
        const isRejected = resolutionState === "REJECTED";

        const resPillBg = isApproved ? colors.emeraldBg : isRejected ? colors.redBg : colors.amberBg;
        const resPillBorder = isApproved ? colors.emeraldBorder : isRejected ? colors.redBorder : colors.amberBorder;
        const resPillText = isApproved ? colors.emeraldText : isRejected ? colors.redText : colors.amberText;

        // Current resolution card
        doc.rect(44, curY, 507, 60).fill(colors.cardBg);
        doc.rect(44, curY, 507, 60).strokeColor(colors.border).lineWidth(1).stroke();

        doc.fillColor(colors.textMuted).fontSize(7).font("Helvetica-Bold")
          .text("DISPOSITION STATUS", 56, curY + 8)
          .text("REVIEWER IDENTITY", 215, curY + 8)
          .text("DECISION RECORDED AT", 375, curY + 8);

        // Status pill
        doc.rect(56, curY + 18, 100, 14).fill(resPillBg);
        doc.rect(56, curY + 18, 100, 14).strokeColor(resPillBorder).lineWidth(0.5).stroke();
        doc.fillColor(resPillText).fontSize(7.5).font("Helvetica-Bold")
          .text(resolutionState.replace(/_/g, " "), 56, curY + 21, { align: "center", width: 100 });

        const reviewerEmail = data.reviewerUser?.email || "compliance.officer@proofline.internal";
        doc.fillColor(colors.textPrimary).fontSize(8).font("Helvetica")
          .text(reviewerEmail, 215, curY + 21)
          .text(data.caseDoc.resolvedAt ? new Date(data.caseDoc.resolvedAt).toISOString().slice(0, 19).replace("T", " ") : "Pending Review Action", 375, curY + 21);

        if (data.caseDoc.resolutionNote) {
          doc.fillColor(colors.textMuted).fontSize(7).font("Helvetica-Bold")
            .text("REVIEWER NOTE:", 56, curY + 40, { continued: true });
          doc.fillColor(colors.textPrimary).font("Helvetica-Oblique")
            .text(` "${data.caseDoc.resolutionNote}"`);
        } else {
          doc.fillColor(colors.textSecondary).fontSize(7).font("Helvetica-Oblique")
            .text("No optional reviewer notes recorded.", 56, curY + 40);
        }

        curY += 72;

        // Audit Trail of Decisions
        if (data.reviewDecisionDocs && data.reviewDecisionDocs.length > 0) {
          doc.fillColor(colors.textPrimary).fontSize(9).font("Helvetica-Bold")
            .text("Chronological Review Audit Log", 44, curY);
          curY += 16;

          data.reviewDecisionDocs.slice(0, 5).forEach((d) => {
            doc.rect(44, curY, 507, 24).fill(colors.cardBg);
            doc.rect(44, curY, 507, 24).strokeColor(colors.border).lineWidth(0.5).stroke();

            const dState = d.decision;
            const dColor = dState === "APPROVED" ? colors.emeraldText : dState === "REJECTED" ? colors.redText : colors.amberText;

            doc.fillColor(dColor).fontSize(7.5).font("Helvetica-Bold")
              .text(dState.replace(/_/g, " "), 54, curY + 5, { continued: true });
            doc.fillColor(colors.textMuted).font("Helvetica")
              .text(`  �  ${new Date(d.decidedAt).toISOString().slice(0, 16).replace("T", " ")}  �  `, { continued: true });
            doc.fillColor(colors.textSecondary).font("Helvetica-Oblique")
              .text(d.note ? `"${d.note}"` : "No note provided");

            curY += 28;
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
