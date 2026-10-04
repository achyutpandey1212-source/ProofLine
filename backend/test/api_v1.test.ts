import { createApp } from "../src/server";
import { ApiKeyService } from "../src/services/apiKey.service";
import { UserModel } from "../src/models/user.model";
import { CaseModel } from "../src/models/case.model";
import { VerificationModel } from "../src/models/verification.model";
import { FindingModel } from "../src/models/finding.model";
import { EvidenceModel } from "../src/models/evidence.model";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import request from "supertest";

async function runApiTestSuite() {
  console.log("=================================================");
  console.log("   PROOFLINE — VERIFICATION API TEST SUITE       ");
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
    // 1. Setup Test Users & API Keys
    const userA = await UserModel.findOneAndUpdate(
      { email: "api-test-user-a@proofline.internal" },
      { firebaseUid: "uid_api_test_a", email: "api-test-user-a@proofline.internal", role: "USER" },
      { upsert: true, new: true }
    );

    const userB = await UserModel.findOneAndUpdate(
      { email: "api-test-user-b@proofline.internal" },
      { firebaseUid: "uid_api_test_b", email: "api-test-user-b@proofline.internal", role: "USER" },
      { upsert: true, new: true }
    );

    const keyResultA = await ApiKeyService.createApiKey(userA._id, "Test Key User A");
    const keyA = keyResultA.apiKey;

    const keyResultB = await ApiKeyService.createApiKey(userB._id, "Test Key User B");
    const keyB = keyResultB.apiKey;

    // A revoked key
    const revokedKeyData = await ApiKeyService.createApiKey(userA._id, "Revoked Key");
    await ApiKeyService.revokeApiKey(userA._id, revokedKeyData.id);
    const keyRevoked = revokedKeyData.apiKey;

    console.log("\n[1. Authentication & Security]");

    // Test 1: Missing API Key
    const resNoAuth = await request(app)
      .post("/api/v1/verifications")
      .send({ transactionId: "TEST-001" });
    assert(
      resNoAuth.status === 401 && resNoAuth.body.error?.code === "UNAUTHORIZED",
      "Missing API key returns 401 Unauthorized"
    );
    assert(!!resNoAuth.headers["x-request-id"], "Request ID header attached to 401 response");

    // Test 2: Invalid API Key
    const resInvalidKey = await request(app)
      .post("/api/v1/verifications")
      .set("Authorization", "Bearer pl_live_invalidkey123456789")
      .send({ transactionId: "TEST-001" });
    assert(
      resInvalidKey.status === 401 && resInvalidKey.body.error?.code === "UNAUTHORIZED",
      "Invalid API key returns 401 Unauthorized"
    );

    // Test 3: Revoked API Key
    const resRevokedKey = await request(app)
      .post("/api/v1/verifications")
      .set("Authorization", `Bearer ${keyRevoked}`)
      .send({ transactionId: "TEST-001" });
    assert(
      resRevokedKey.status === 401 && resRevokedKey.body.error?.code === "UNAUTHORIZED",
      "Revoked API key returns 401 Unauthorized"
    );

    console.log("\n[2. Request Validation & Error Contract]");

    // Test 4: Missing required fields
    const resValidation1 = await request(app)
      .post("/api/v1/verifications")
      .set("Authorization", `Bearer ${keyA}`)
      .send({ transactionId: "EW-104" });
    assert(
      resValidation1.status === 400 && resValidation1.body.error?.code === "VALIDATION_ERROR",
      "Missing required fields returns 400 with VALIDATION_ERROR"
    );

    // Test 5: Invalid quantity (negative)
    const resValidation2 = await request(app)
      .post("/api/v1/verifications")
      .set("Authorization", `Bearer ${keyA}`)
      .send({
        transactionId: "EW-104",
        partnerName: "Test Partner",
        material: "PET Flakes",
        claimedQuantity: -50,
        unit: "kg",
      });
    assert(
      resValidation2.status === 400 && resValidation2.body.error?.code === "VALIDATION_ERROR",
      "Negative quantity returns 400 validation error"
    );

    // Test 6: Unsupported unit
    const resValidation3 = await request(app)
      .post("/api/v1/verifications")
      .set("Authorization", `Bearer ${keyA}`)
      .send({
        transactionId: "EW-104",
        partnerName: "Test Partner",
        material: "PET Flakes",
        claimedQuantity: 500,
        unit: "barrels",
      });
    assert(
      resValidation3.status === 400 && resValidation3.body.error?.message.includes("Invalid verification request"),
      "Unsupported unit returns 400 validation error"
    );

    console.log("\n[3. Create Verification & Idempotency]");

    const idempotencyKey = `idemp_${Date.now()}`;
    const payload = {
      transactionId: `EW-AUTO-${Date.now()}`,
      partnerName: "ABC Recycling Pvt Ltd",
      material: "PET Plastic Flakes",
      claimedQuantity: 560,
      unit: "kg",
      organization: "Apex Polymer Solutions Ltd",
      notes: "Automated API Test #4492",
    };

    // Test 7: Create Verification successfully
    const resCreate = await request(app)
      .post("/api/v1/verifications")
      .set("Authorization", `Bearer ${keyA}`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    assert(
      resCreate.status === 201 && resCreate.body.id && resCreate.body.status === "CREATED",
      "POST /api/v1/verifications creates verification case (201)"
    );
    const createdId = resCreate.body.id;

    // Test 8: Idempotent Replay
    const resReplay = await request(app)
      .post("/api/v1/verifications")
      .set("Authorization", `Bearer ${keyA}`)
      .set("Idempotency-Key", idempotencyKey)
      .send(payload);

    assert(
      resReplay.status === 201 &&
        resReplay.body.id === createdId &&
        resReplay.headers["idempotent-replay"] === "true",
      "Duplicate Idempotency-Key returns cached response without duplicate records"
    );

    console.log("\n[4. Evidence Upload & Ownership Isolation]");

    // Test 9: Upload Evidence with User A Key
    const fakeInvoice = Buffer.from("%PDF-1.4 Fake PDF Content for Invoice EW-104");
    const resEvidence = await request(app)
      .post(`/api/v1/verifications/${createdId}/evidence`)
      .set("Authorization", `Bearer ${keyA}`)
      .field("evidenceType", "INVOICE")
      .attach("file", fakeInvoice, "invoice-ew104.pdf");

    assert(
      resEvidence.status === 201 && resEvidence.body.type === "INVOICE",
      "POST /api/v1/verifications/:id/evidence attaches evidence successfully"
    );

    // Test 10: Ownership Isolation - User B attempts to access User A's verification
    const resUserBAccess = await request(app)
      .get(`/api/v1/verifications/${createdId}`)
      .set("Authorization", `Bearer ${keyB}`);

    assert(
      resUserBAccess.status === 404 && resUserBAccess.body.error?.code === "NOT_FOUND",
      "User B accessing User A resource returns 404 Not Found (Isolation enforced)"
    );

    // Test 11: Ownership Isolation - User B attempts to upload evidence to User A's verification
    const resUserBUpload = await request(app)
      .post(`/api/v1/verifications/${createdId}/evidence`)
      .set("Authorization", `Bearer ${keyB}`)
      .field("evidenceType", "SCALE_IMAGE")
      .attach("file", fakeInvoice, "scale.jpg");

    assert(
      resUserBUpload.status === 404 && resUserBUpload.body.error?.code === "NOT_FOUND",
      "User B uploading to User A resource returns 404 Not Found"
    );

    console.log("\n[5. Verification Status & Proof Packet]");

    // Test 12: GET status for pending verification
    const resGetStatus = await request(app)
      .get(`/api/v1/verifications/${createdId}`)
      .set("Authorization", `Bearer ${keyA}`);

    assert(
      resGetStatus.status === 200 && resGetStatus.body.id === createdId,
      "GET /api/v1/verifications/:id returns status model"
    );

    // Test 13: Proof Packet before completion returns 400
    const resPacketIncomplete = await request(app)
      .get(`/api/v1/verifications/${createdId}/proof-packet`)
      .set("Authorization", `Bearer ${keyA}`);

    assert(
      resPacketIncomplete.status === 400 &&
        resPacketIncomplete.body.error?.code === "VERIFICATION_NOT_COMPLETE",
      "Proof Packet export before completion returns 400 VERIFICATION_NOT_COMPLETE"
    );

    // Populate a completed verification doc in MongoDB to verify GET result & PDF export
    const caseDoc = await CaseModel.findOne({ caseId: createdId });
    if (caseDoc) {
      await VerificationModel.create({
        caseId: caseDoc._id,
        status: "COMPLETED",
        overallRisk: "LOW",
        calculatedValues: {
          claimedWeight: 560,
          measuredWeight: 555.6,
          differenceWeight: -4.4,
          variancePercentage: -0.79,
        },
        ruleResults: [
          {
            ruleId: "RULE_TOLERANCE",
            status: "PASS",
            severity: "LOW",
            message: "Within 2% tolerance threshold",
          },
        ],
        verifiedAt: new Date(),
      });
    }

    // Test 14: Completed verification returns full structured result DTO
    const resCompleted = await request(app)
      .get(`/api/v1/verifications/${createdId}`)
      .set("Authorization", `Bearer ${keyA}`);

    assert(
      resCompleted.status === 200 &&
        resCompleted.body.status === "COMPLETED" &&
        resCompleted.body.result?.decision === "VERIFIED" &&
        resCompleted.body.result?.risk === "LOW",
      "GET /api/v1/verifications/:id returns completed decision, risk, and metrics DTO"
    );

    // Test 15: Proof Packet export on completed verification returns official PDF
    const resPdf = await request(app)
      .get(`/api/v1/verifications/${createdId}/proof-packet`)
      .set("Authorization", `Bearer ${keyA}`);

    assert(
      resPdf.status === 200 &&
        resPdf.headers["content-type"] === "application/pdf" &&
        resPdf.body.length > 3000,
      "GET /api/v1/verifications/:id/proof-packet streams vector PDF dossier (>3KB)"
    );

    console.log("\n[6. Rate Limiting Protection]");

    // Test 16: Rate Limiter triggers 429 when threshold exceeded
    let hitRateLimit = false;
    for (let i = 0; i < 65; i++) {
      const resRate = await request(app)
        .get(`/api/v1/verifications/${createdId}`)
        .set("Authorization", `Bearer ${keyA}`);
      if (resRate.status === 429 && resRate.body.error?.code === "RATE_LIMIT_EXCEEDED") {
        hitRateLimit = true;
        break;
      }
    }
    assert(hitRateLimit, "Lightweight rate limiter returns 429 Too Many Requests when limit exceeded");
  } finally {
    await disconnectDatabase();
  }

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runApiTestSuite().catch((err) => {
  console.error("Test execution crashed:", err);
  process.exit(1);
});
