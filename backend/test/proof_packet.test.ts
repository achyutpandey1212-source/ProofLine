import { ProofPacketService } from "../src/services/proofPacket.service";
import fs from "fs";
import path from "path";

async function testPdfGeneration() {
  console.log("Starting Proof Packet PDF Generation Test...");

  const mockCase: any = {
    _id: "507f1f77bcf86cd799439011",
    transactionId: "TX-TEST-2026-904",
    title: "EW-104 Test Grain Settlement",
    status: "VERIFIED",
    settlementAmount: 18500.0,
    currency: "USD",
    discrepancyCount: 0,
    createdAt: new Date("2026-03-15T10:00:00Z"),
    updatedAt: new Date("2026-03-15T10:05:00Z"),
  };

  const mockVerification: any = {
    _id: "607f1f77bcf86cd799439022",
    status: "COMPLETED",
    result: "VERIFIED",
    riskLevel: "LOW",
    calculatedValues: {
      claimedQuantity: 560,
      measuredQuantity: 555.6,
      difference: -4.4,
      variancePercentage: -0.79,
      declaredTolerance: 2.0,
      isWithinTolerance: true,
      unit: "kg",
    },
    ruleResults: [
      {
        ruleId: "RULE_WEIGHT_TOLERANCE",
        ruleName: "Weight Variance Within Allowed Tolerance",
        status: "PASS",
        message: "Variance of 0.79% is within allowed threshold of 2.0%.",
      },
      {
        ruleId: "RULE_SCALE_EVIDENCE_COMPLETENESS",
        ruleName: "Scale Ticket Aggregation Integrity",
        status: "PASS",
        message: "All 3 certified scale images accounted for without gaps.",
      },
      {
        ruleId: "RULE_TIMESTAMPS_CONSISTENCY",
        ruleName: "Chronological Sequence Alignment",
        status: "PASS",
        message: "Scale tickets and invoice timestamps verified in order.",
      },
    ],
    updatedAt: new Date("2026-03-15T10:05:00Z"),
  };

  const mockFindings: any[] = [];

  const mockEvidenceList: any[] = [
    {
      _id: "707f1f77bcf86cd799439031",
      fileName: "invoice-ew104.jpg",
      documentType: "INVOICE",
      status: "EXTRACTED",
      s3Key: "vault/cases/TX-TEST/invoice-ew104.jpg",
      extraction: {
        weight: { value: 560, unit: "kg", confidence: 0.99 },
      },
    },
    {
      _id: "707f1f77bcf86cd799439032",
      fileName: "scale-ticket-01.jpg",
      documentType: "SCALE_TICKET",
      status: "EXTRACTED",
      s3Key: "vault/cases/TX-TEST/scale-ticket-01.jpg",
      extraction: {
        weight: { value: 184.6, unit: "kg", confidence: 0.98 },
      },
    },
    {
      _id: "707f1f77bcf86cd799439033",
      fileName: "scale-ticket-02.jpg",
      documentType: "SCALE_TICKET",
      status: "EXTRACTED",
      s3Key: "vault/cases/TX-TEST/scale-ticket-02.jpg",
      extraction: {
        weight: { value: 193.2, unit: "kg", confidence: 0.98 },
      },
    },
    {
      _id: "707f1f77bcf86cd799439034",
      fileName: "scale-ticket-03.jpg",
      documentType: "SCALE_TICKET",
      status: "EXTRACTED",
      s3Key: "vault/cases/TX-TEST/scale-ticket-03.jpg",
      extraction: {
        weight: { value: 177.8, unit: "kg", confidence: 0.97 },
      },
    },
  ];

  const mockProofGraph: any = {
    nodes: [
      { id: "case_1", label: "Case EW-104", type: "CASE" },
      { id: "ev_1", label: "invoice-ew104.jpg", type: "EVIDENCE" },
      { id: "ev_2", label: "scale-ticket-01.jpg", type: "EVIDENCE" },
      { id: "fact_1", label: "Claimed: 560 kg", type: "FACT" },
      { id: "fact_2", label: "Measured: 555.6 kg", type: "FACT" },
      { id: "rule_1", label: "Tolerance Check: PASS", type: "RULE" },
      { id: "ver_1", label: "VERIFIED / LOW RISK", type: "VERIFICATION" },
    ],
    edges: [
      { from: "case_1", to: "ev_1", label: "includes" },
      { from: "case_1", to: "ev_2", label: "includes" },
      { from: "ev_1", to: "fact_1", label: "asserts" },
      { from: "ev_2", to: "fact_2", label: "asserts" },
      { from: "fact_1", to: "rule_1", label: "evaluated_by" },
      { from: "fact_2", to: "rule_1", label: "evaluated_by" },
      { from: "rule_1", to: "ver_1", label: "proves" },
    ],
  };

  const buffer = await ProofPacketService.generateProofPacketPdf({
    caseDoc: mockCase,
    verificationDoc: mockVerification,
    findingDocs: mockFindings,
    evidenceDocs: mockEvidenceList,
    proofGraph: mockProofGraph,
    generatedAt: new Date("2026-03-15T10:05:00Z"),
    version: "1.0",
  });

  console.log(`PDF successfully generated! Buffer size: ${buffer.length} bytes`);
  
  if (!buffer || buffer.length < 5000) {
    throw new Error(`PDF generation output size is suspiciously small: ${buffer.length} bytes`);
  }

  const pdfHeader = buffer.subarray(0, 5).toString("utf-8");
  if (!pdfHeader.startsWith("%PDF-")) {
    throw new Error(`Buffer does not have valid PDF header: ${pdfHeader}`);
  }

  const outputPath = path.join(__dirname, "test-output.pdf");
  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved test PDF to ${outputPath}`);
  console.log("Proof Packet generation verification passed!");
}

testPdfGeneration().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
