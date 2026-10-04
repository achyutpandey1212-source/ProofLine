import { VerificationEngine } from "../src/verification/verification.engine";

console.log("=== RUNNING PROOFLINE ADVERSARIAL SIMULATION VERIFICATION ===");

// 1. Base Case: EW-104 (Claimed 560 kg, Scale Tickets: 184.6 + 193.2 + 177.8 = 555.6 kg)
const baseCase: any = {
  caseId: "EW-104",
  transactionId: "EW-104",
  partnerName: "EcoWaste Recyclers Ltd",
  material: "PET Plastic Flakes",
  claimedQuantity: 560,
  unit: "kg",
  status: "VERIFICATION_COMPLETE",
};

const baseEvidence: any[] = [
  {
    evidenceId: "EV-01",
    type: "INVOICE",
    file: { name: "invoice-ew104.jpg" },
    status: "EXTRACTED",
    extraction: {
      status: "EXTRACTED",
      confidence: 0.95,
      data: {
        transactionId: "EW-104",
        quantity: 560,
        sellerName: "EcoWaste Recyclers Ltd",
        material: "PET Plastic Flakes",
      },
    },
  },
  {
    evidenceId: "EV-02",
    type: "SCALE_IMAGE",
    file: { name: "scale-ticket-01.jpg" },
    status: "EXTRACTED",
    extraction: {
      status: "EXTRACTED",
      confidence: 0.92,
      data: { weight: 184.6, unit: "kg" },
    },
  },
  {
    evidenceId: "EV-03",
    type: "SCALE_IMAGE",
    file: { name: "scale-ticket-02.jpg" },
    status: "EXTRACTED",
    extraction: {
      status: "EXTRACTED",
      confidence: 0.94,
      data: { weight: 193.2, unit: "kg" },
    },
  },
  {
    evidenceId: "EV-04",
    type: "SCALE_IMAGE",
    file: { name: "scale-ticket-03.jpg" },
    status: "EXTRACTED",
    extraction: {
      status: "EXTRACTED",
      confidence: 0.91,
      data: { weight: 177.8, unit: "kg" },
    },
  },
];

// Test 1: Normal verification
const normalResult = VerificationEngine.verify({
  caseDoc: baseCase,
  evidenceDocs: baseEvidence,
});

console.log("\n[TEST 1] Normal EW-104:");
console.log("- Overall Risk:", normalResult.overallRisk);
console.log("- Measured Weight:", normalResult.calculatedValues.measuredWeight, "kg");
console.log("- Claimed Weight:", normalResult.calculatedValues.claimedWeight, "kg");
console.log("- Variance:", normalResult.calculatedValues.variancePercentage, "%");
console.log("- Findings Count:", normalResult.findings.length);

if (
  normalResult.overallRisk === "LOW" &&
  normalResult.calculatedValues.measuredWeight === 555.6 &&
  normalResult.calculatedValues.variancePercentage === 0.79
) {
  console.log("--> PASS: Normal mode correctly outputs 555.6 kg vs 560 kg with 0.79% variance and LOW risk.");
} else {
  console.error("--> FAIL: Normal mode did not match expected baseline!");
  process.exit(1);
}

// Test 2: Scenario A - Weight Mismatch Simulation (Altering scale ticket 1 by +85 kg)
const mutatedWeightEvidence = JSON.parse(JSON.stringify(baseEvidence));
mutatedWeightEvidence[1].extraction.data.weight = 184.6 + 85.0; // 269.6 kg -> Total: 640.6 kg (+14.39% variance)

const weightSimResult = VerificationEngine.verify({
  caseDoc: baseCase,
  evidenceDocs: mutatedWeightEvidence,
});

console.log("\n[TEST 2] Scenario A (Weight Mismatch):");
console.log("- Overall Risk:", weightSimResult.overallRisk);
console.log("- Measured Weight:", weightSimResult.calculatedValues.measuredWeight, "kg");
console.log("- Variance:", weightSimResult.calculatedValues.variancePercentage, "%");
console.log("- Finding Titles:", weightSimResult.findings.map((f) => f.title));

if (
  weightSimResult.overallRisk !== "LOW" &&
  weightSimResult.findings.some((f) => f.type === "WEIGHT_MISMATCH")
) {
  console.log("--> PASS: Weight mismatch generated finding and increased risk level away from LOW.");
} else {
  console.error("--> FAIL: Weight mismatch did not trigger expected finding!");
  process.exit(1);
}

// Test 3: Scenario B - Invoice Quantity Mismatch (Invoice claimed 620 kg vs 555.6 kg measured)
const invoiceCase = { ...baseCase, claimedQuantity: 620 };
const mutatedInvoiceEvidence = JSON.parse(JSON.stringify(baseEvidence));
mutatedInvoiceEvidence[0].extraction.data.quantity = 620;

const invoiceSimResult = VerificationEngine.verify({
  caseDoc: invoiceCase,
  evidenceDocs: mutatedInvoiceEvidence,
});

console.log("\n[TEST 3] Scenario B (Invoice Quantity Mismatch):");
console.log("- Overall Risk:", invoiceSimResult.overallRisk);
console.log("- Claimed:", invoiceSimResult.calculatedValues.claimedWeight, "kg");
console.log("- Measured:", invoiceSimResult.calculatedValues.measuredWeight, "kg");
console.log("- Variance:", invoiceSimResult.calculatedValues.variancePercentage, "%");

if (
  invoiceSimResult.overallRisk !== "LOW" &&
  invoiceSimResult.findings.some((f) => f.type === "WEIGHT_MISMATCH")
) {
  console.log("--> PASS: Invoice quantity mismatch correctly triggered tolerance discrepancy.");
} else {
  console.error("--> FAIL: Invoice quantity mismatch did not trigger expected finding!");
  process.exit(1);
}

// Test 4: Scenario C - Transaction ID Mismatch (Invoice has EW-999)
const mutatedTxEvidence = JSON.parse(JSON.stringify(baseEvidence));
mutatedTxEvidence[0].extraction.data.transactionId = "EW-999";

const txSimResult = VerificationEngine.verify({
  caseDoc: baseCase,
  evidenceDocs: mutatedTxEvidence,
});

console.log("\n[TEST 4] Scenario C (Transaction ID Mismatch):");
console.log("- Overall Risk:", txSimResult.overallRisk);
console.log("- Findings:", txSimResult.findings.map((f) => f.title));

if (
  txSimResult.findings.some((f) => f.type === "TRANSACTION_ID_MISMATCH")
) {
  console.log("--> PASS: Transaction ID mismatch correctly detected EW-999 inconsistency.");
} else {
  console.error("--> FAIL: Transaction ID mismatch did not trigger expected finding!");
  process.exit(1);
}

// Test 5: Scenario D - Material Inconsistency (HDPE vs PET)
const mutatedMatEvidence = JSON.parse(JSON.stringify(baseEvidence));
mutatedMatEvidence[0].extraction.data.material = "HDPE Plastic Flakes";
mutatedMatEvidence[0].extraction.data.materialDescription = "HDPE Plastic Flakes";

const matSimResult = VerificationEngine.verify({
  caseDoc: baseCase,
  evidenceDocs: mutatedMatEvidence,
});

console.log("\n[TEST 5] Scenario D (Material Inconsistency):");
console.log("- Overall Risk:", matSimResult.overallRisk);
console.log("- Findings:", matSimResult.findings.map((f) => f.title));

if (
  matSimResult.findings.some((f) => f.type === "MATERIAL_MISMATCH")
) {
  console.log("--> PASS: Material discrepancy correctly detected conflicting material.");
} else {
  console.error("--> FAIL: Material discrepancy did not trigger expected finding!");
  process.exit(1);
}

console.log("\nALL 5 REGRESSION TESTS PASSED DETERMINISTICALLY!");
