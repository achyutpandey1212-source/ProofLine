import mongoose from "mongoose";
import http from "http";
import admin from "firebase-admin";
import { createApp } from "../src/server";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { UserModel } from "../src/models/user.model";
import { CaseModel } from "../src/models/case.model";
import { EvidenceModel } from "../src/models/evidence.model";
import { VerificationModel } from "../src/models/verification.model";
import { FindingModel } from "../src/models/finding.model";
import { ReviewDecisionModel } from "../src/models/reviewDecision.model";

// Mock Firebase token verification for controlled test execution
// Mock Firebase token verification for controlled test execution
const mockFirebaseTokens: Record<string, { uid: string; email: string }> = {
  "token-user-a": { uid: "firebase_user_a_123", email: "user_a@proofline.test" },
  "token-user-b": { uid: "firebase_user_b_456", email: "user_b@proofline.test" },
};

import { initializeFirebase } from "../src/config/firebase";

const appInstance = initializeFirebase();
if (appInstance) {
  const authService = appInstance.auth();
  authService.verifyIdToken = (async (token: string) => {
    const matched = mockFirebaseTokens[token];
    if (matched) {
      return {
        uid: matched.uid,
        email: matched.email,
        aud: "proofline-test",
        auth_time: Date.now() / 1000,
        exp: Date.now() / 1000 + 3600,
        firebase: { identities: {}, sign_in_provider: "google.com" },
        iss: "https://securetoken.google.com/proofline-test",
        sub: matched.uid,
      } as admin.auth.DecodedIdToken;
    }
    throw new Error("Decoding Firebase ID token failed: invalid mock token");
  }) as typeof authService.verifyIdToken;
}

const runSuite = async () => {
  console.log("=== BEGINNING PHASE 2 TEST SUITE ===");

  await connectDatabase();
  const app = createApp();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5098, resolve));
  const baseUrl = "http://localhost:5098";

  let passed = 0;
  let failed = 0;

  const assert = (name: string, condition: boolean, detail?: string) => {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name} - ${detail || "Condition not met"}`);
      failed++;
    }
  };

  try {
    // 0. Clean test data
    await UserModel.deleteMany({ email: /@proofline\.test$/ });
    await CaseModel.deleteMany({ transactionId: /^TEST-TX-/ });

    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthBody = await healthRes.json();
    assert("Health endpoint returns 200", healthRes.status === 200 && healthBody.status === "ok");

    // 2. Unauthenticated access to /cases -> 401
    const unauthRes = await fetch(`${baseUrl}/cases`);
    assert("GET /cases unauthenticated returns 401", unauthRes.status === 401);

    // 3. Invalid token access -> 401
    const invalidTokenRes = await fetch(`${baseUrl}/cases`, {
      headers: { Authorization: "Bearer bad-token" },
    });
    assert("GET /cases with invalid token returns 401", invalidTokenRes.status === 401);

    // 4. Authenticated User A creates Case A
    const createCasePayload = {
      transactionId: "TEST-TX-100",
      partnerName: "Alpha Recycling Ltd",
      material: "PET Plastic",
      claimedQuantity: 560,
      unit: "kg",
      organization: "Alpha Corp",
    };

    const createCaseRes = await fetch(`${baseUrl}/cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
      body: JSON.stringify(createCasePayload),
    });

    const createCaseBody = await createCaseRes.json();
    assert("POST /cases creates case with 201", createCaseRes.status === 201 && createCaseBody.success === true);
    const caseAId = createCaseBody.data?.id;
    const caseAIdentifier = createCaseBody.data?.caseId;

    // 5. Verify User Provisioning
    const userADoc = await UserModel.findOne({ firebaseUid: "firebase_user_a_123" });
    assert("User A provisioned with unique firebaseUid index", userADoc !== null && userADoc.email === "user_a@proofline.test");

    // 6. User A lists cases -> contains Case A
    const listCaseARes = await fetch(`${baseUrl}/cases`, {
      headers: { Authorization: "Bearer token-user-a" },
    });
    const listCaseABody = await listCaseARes.json();
    assert(
      "User A lists cases returns Case A",
      listCaseARes.status === 200 &&
        listCaseABody.data.length >= 1 &&
        listCaseABody.data.some((c: { id: string }) => c.id === caseAId)
    );

    // 7. User A retrieves own Case A by ID -> 200
    const getCaseARes = await fetch(`${baseUrl}/cases/${caseAId}`, {
      headers: { Authorization: "Bearer token-user-a" },
    });
    const getCaseABody = await getCaseARes.json();
    assert(
      "User A gets owned case by Mongo ID returns 200",
      getCaseARes.status === 200 && getCaseABody.data.caseId === caseAIdentifier
    );

    // 8. User B (different user) attempts GET /cases/CaseA -> 404 (BLOCKED & existence hidden)
    const getCaseBRes = await fetch(`${baseUrl}/cases/${caseAId}`, {
      headers: { Authorization: "Bearer token-user-b" },
    });
    assert("User B accessing Case A is BLOCKED with 404", getCaseBRes.status === 404);

    // 9. User B lists cases -> Case A is NOT present
    const listCaseBRes = await fetch(`${baseUrl}/cases`, {
      headers: { Authorization: "Bearer token-user-b" },
    });
    const listCaseBBody = await listCaseBRes.json();
    assert(
      "User B lists cases does NOT reveal Case A",
      listCaseBRes.status === 200 &&
        !listCaseBBody.data.some((c: { id: string }) => c.id === caseAId)
    );

    // 10. Validation rejection on invalid POST /cases payload -> 400
    const invalidBodyRes = await fetch(`${baseUrl}/cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
      body: JSON.stringify({
        transactionId: "", // empty violates schema
        claimedQuantity: -10, // negative violates schema
      }),
    });
    const invalidBodyJson = await invalidBodyRes.json();
    assert(
      "Invalid case body rejected with 400 and validation details",
      invalidBodyRes.status === 400 && invalidBodyJson.error?.code === "VALIDATION_ERROR"
    );

    // 11. Verify Supporting Models exist and can be instantiated
    const testEvidence = new EvidenceModel({
      evidenceId: "EVD-TEST-001",
      caseId: new mongoose.Types.ObjectId(caseAId),
      uploadedBy: userADoc!._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_123",
        url: "https://ik.imagekit.io/test/scale1.jpg",
        name: "scale1.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 204800,
      },
      status: "UPLOADED",
    });
    assert("Evidence model can be instantiated with schema", testEvidence.type === "SCALE_IMAGE");

    const testVerification = new VerificationModel({
      caseId: new mongoose.Types.ObjectId(caseAId),
      status: "PENDING",
      overallRisk: "LOW",
      ruleResults: [],
    });
    assert("Verification model can be instantiated with schema", testVerification.status === "PENDING");

    const testFinding = new FindingModel({
      findingId: "FND-TEST-001",
      caseId: new mongoose.Types.ObjectId(caseAId),
      ruleId: "WEIGHT_RECONCILIATION",
      type: "WEIGHT_MISMATCH",
      severity: "MEDIUM",
      title: "Weight mismatch",
      description: "Discrepancy detected",
    });
    assert("Finding model can be instantiated with schema", testFinding.severity === "MEDIUM");

    const testReviewDecision = new ReviewDecisionModel({
      caseId: new mongoose.Types.ObjectId(caseAId),
      reviewedBy: userADoc!._id,
      decision: "REQUEST_CLARIFICATION",
      comment: "Please verify quantity discrepancy",
    });
    assert("ReviewDecision model can be instantiated with schema", testReviewDecision.decision === "REQUEST_CLARIFICATION");

    // Clean test data
    await UserModel.deleteMany({ email: /@proofline\.test$/ });
    await CaseModel.deleteMany({ transactionId: /^TEST-TX-/ });
  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log(`\n=== TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error("Test suite runtime error:", err);
  process.exit(1);
});
