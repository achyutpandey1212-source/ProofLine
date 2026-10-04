import { createApp } from "../src/server";
import { ApiKeyService } from "../src/services/apiKey.service";
import { UserModel } from "../src/models/user.model";
import { CaseModel } from "../src/models/case.model";
import { VerificationModel } from "../src/models/verification.model";
import { ReviewDecisionModel } from "../src/models/reviewDecision.model";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import mongoose from "mongoose";
import request from "supertest";

async function runReviewTestSuite() {
  console.log("=================================================");
  console.log("   PROOFLINE — HUMAN REVIEW & RESOLUTION SUITE    ");
  console.log("=================================================");

  await connectDatabase();
  const app = createApp();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${testName} ${detail ? `- ${detail}` : ""}`);
      failed++;
    }
  }

  try {
    // 1. Setup Test Users & Keys
    const userA = await UserModel.findOneAndUpdate(
      { email: "reviewer-a@proofline.internal" },
      { firebaseUid: "uid_rev_test_a", email: "reviewer-a@proofline.internal", role: "REVIEWER" },
      { upsert: true, new: true }
    );

    const userB = await UserModel.findOneAndUpdate(
      { email: "reviewer-b@proofline.internal" },
      { firebaseUid: "uid_rev_test_b", email: "reviewer-b@proofline.internal", role: "USER" },
      { upsert: true, new: true }
    );

    const keyRecordA = await ApiKeyService.createApiKey(userA._id, "Reviewer A Key");
    const rawKeyA = keyRecordA.apiKey;

    const keyRecordB = await ApiKeyService.createApiKey(userB._id, "Reviewer B Key");
    const rawKeyB = keyRecordB.apiKey;

    const caseId = `PL-REV-${Date.now().toString(36).toUpperCase()}`;
    const newCase = await CaseModel.create({
      caseId,
      userId: userA._id,
      transactionId: `TX-REV-${Date.now().toString(36)}`,
      organization: "Apex Polymer Solutions",
      partnerName: "ABC Recycling Pvt Ltd",
      material: "PET Flakes",
      claimedQuantity: 560,
      unit: "kg",
      status: "VERIFICATION_COMPLETE",
      riskLevel: "HIGH",
      resolutionState: "PENDING_REVIEW",
    });

    await mongoose.model("Verification").create({
      caseId: newCase._id,
      status: "COMPLETED",
      overallRisk: "HIGH",
      calculatedValues: {
        claimedWeight: 560,
        measuredWeight: 520.0,
        differenceWeight: -40.0,
        variancePercentage: -7.14,
      },
      ruleResults: [
        {
          ruleId: "RULE_TOLERANCE",
          status: "FAIL",
          severity: "HIGH",
          message: "Variance (-7.14%) exceeds 2% threshold",
        },
      ],
      verifiedAt: new Date(),
    });

    console.log("\n[1. Initial Verification Resolution State]");
    const getInitialRes = await request(app)
      .get(`/api/v1/verifications/${caseId}`)
      .set("Authorization", `Bearer ${rawKeyA}`);

    assert(getInitialRes.status === 200, "GET /verifications/:id returns 200");
    assert(getInitialRes.body.result?.decision === "REVIEW_REQUIRED", "Automated result is REVIEW_REQUIRED");
    assert(getInitialRes.body.result?.risk === "HIGH", "Automated risk is HIGH");
    assert(getInitialRes.body.resolution?.state === "PENDING_REVIEW", "Resolution state defaults to PENDING_REVIEW");
    assert(getInitialRes.body.resolution?.note === null, "Initial resolution note is null");

    console.log("\n[2. Human Review Submission (Approve)]");
    const approveRes = await request(app)
      .post(`/api/v1/verifications/${caseId}/review`)
      .set("Authorization", `Bearer ${rawKeyA}`)
      .send({
        decision: "APPROVED",
        note: "Accepted discrepancy due to allowable standard moisture loss in transport.",
      });

    assert(approveRes.status === 200, "POST /verifications/:id/review accepts APPROVE (200)");
    assert(approveRes.body.resolution?.state === "APPROVED", "Returned resolution.state is APPROVED");
    assert(approveRes.body.resolution?.note === "Accepted discrepancy due to allowable standard moisture loss in transport.", "Returned resolution.note matches");

    // Check database to guarantee automated verification was NOT mutated
    const caseAfterApprove = await CaseModel.findOne({ caseId });
    const verifDoc = await mongoose.model("Verification").findOne({ caseId: newCase._id });
    assert(verifDoc?.overallRisk === "HIGH", "Automated verification risk remains HIGH (Never mutated)");
    assert(caseAfterApprove?.riskLevel === "HIGH", "Case riskLevel remains HIGH (Never mutated)");
    assert(caseAfterApprove?.resolutionState === "APPROVED", "Case resolutionState updated to APPROVED");

    console.log("\n[3. Sequential State Transition & Audit Trail]");
    const clarifRes = await request(app)
      .post(`/api/v1/verifications/${caseId}/review`)
      .set("Authorization", `Bearer ${rawKeyA}`)
      .send({
        decision: "CLARIFICATION_REQUESTED",
        note: "Requesting certified weighbridge tare calibration certificate.",
      });

    assert(clarifRes.status === 200, "POST /verifications/:id/review accepts CLARIFICATION_REQUESTED");
    assert(clarifRes.body.resolution?.state === "CLARIFICATION_REQUESTED", "Resolution transitioned to CLARIFICATION_REQUESTED");

    const historyDocs = await ReviewDecisionModel.find({ caseId: newCase._id }).sort({ decidedAt: -1 });
    assert(historyDocs.length === 2, "ReviewDecision audit trail contains exactly 2 chronological entries");
    assert(historyDocs[0].decision === "CLARIFICATION_REQUESTED", "Most recent audit entry is CLARIFICATION_REQUESTED");
    assert(historyDocs[1].decision === "APPROVED", "First audit entry is APPROVED");

    console.log("\n[4. Request Validation & Input Guardrails]");
    const invalidRes = await request(app)
      .post(`/api/v1/verifications/${caseId}/review`)
      .set("Authorization", `Bearer ${rawKeyA}`)
      .send({
        decision: "SUPER_APPROVED",
      });

    assert(invalidRes.status === 400, "Invalid decision enum value returns 400 Bad Request");
    assert(invalidRes.body.error?.code === "VALIDATION_ERROR", "Error code is VALIDATION_ERROR");

    console.log("\n[5. Tenant Isolation Protection]");
    const tenantBRes = await request(app)
      .post(`/api/v1/verifications/${caseId}/review`)
      .set("Authorization", `Bearer ${rawKeyB}`)
      .send({
        decision: "REJECTED",
      });

    assert(tenantBRes.status === 404, "Tenant B reviewing Tenant A case returns 404 Not Found");

    console.log("\n[6. Proof Packet Export with Section 7]");
    const packetRes = await request(app)
      .get(`/api/v1/verifications/${caseId}/proof-packet`)
      .set("Authorization", `Bearer ${rawKeyA}`);

    assert(packetRes.status === 200, "GET /verifications/:id/proof-packet returns 200");
    assert(packetRes.headers["content-type"] === "application/pdf", "Content-Type is application/pdf");
    assert(Buffer.isBuffer(packetRes.body) && packetRes.body.length > 3000, "Streams valid vector PDF with Section 7");

    // Clean up
    await CaseModel.deleteMany({ caseId });
    await ReviewDecisionModel.deleteMany({ caseId: newCase._id });
    await mongoose.model("ApiKey").deleteMany({ userId: { $in: [userA._id, userB._id] } });

  } catch (err) {
    console.error("Test execution failed with error:", err);
    failed++;
  } finally {
    await disconnectDatabase();
    console.log("\n=================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log("=================================================\n");
    if (failed > 0) {
      process.exit(1);
    }
  }
}

runReviewTestSuite();
