import http from "http";
import admin from "firebase-admin";
import { createApp } from "../src/server";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { UserModel } from "../src/models/user.model";
import { CaseModel } from "../src/models/case.model";
import { EvidenceModel } from "../src/models/evidence.model";
import { VerificationModel } from "../src/models/verification.model";
import { FindingModel } from "../src/models/finding.model";
import { WorkflowRunModel } from "../src/models/workflowRun.model";
import { GeminiExtractionService } from "../src/services/geminiExtraction.service";

// Mock Firebase token verification for controlled test execution
const mockFirebaseTokens: Record<string, { uid: string; email: string }> = {
  "token-user-a": { uid: "firebase_user_a_wf_123", email: "user_a_wf@proofline.test" },
  "token-user-b": { uid: "firebase_user_b_wf_456", email: "user_b_wf@proofline.test" },
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
  console.log("=== BEGINNING PHASE 3.4 TEST SUITE ===");

  await connectDatabase();
  const app = createApp();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5094, resolve));
  const baseUrl = "http://localhost:5094";

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
    await CaseModel.deleteMany({ transactionId: /^WF-TX-/ });
    await EvidenceModel.deleteMany({ evidenceId: /^EVD-WF-/ });
    await VerificationModel.deleteMany({});
    await FindingModel.deleteMany({});
    await WorkflowRunModel.deleteMany({});

    // 1. Setup User A & User B
    const userA = await UserModel.create({
      firebaseUid: "firebase_user_a_wf_123",
      email: "user_a_wf@proofline.test",
      role: "USER",
    });

    await UserModel.create({
      firebaseUid: "firebase_user_b_wf_456",
      email: "user_b_wf@proofline.test",
      role: "USER",
    });

    // 2. Setup Case 1: Complete workflow test with pending evidence that needs extraction
    // Claimed: 560 kg, EW-104, ABC Recycling Pvt Ltd
    const case1 = await CaseModel.create({
      caseId: "PL-WF-000101",
      userId: userA._id,
      transactionId: "WF-TX-104",
      partnerName: "ABC Recycling Pvt Ltd",
      material: "PET Plastic",
      claimedQuantity: 560,
      unit: "kg",
      status: "EVIDENCE_READY",
    });

    // Evidence 1: Already EXTRACTED invoice (re-use test)
    await EvidenceModel.create({
      evidenceId: "EVD-WF-INV-01",
      caseId: case1._id,
      uploadedBy: userA._id,
      type: "INVOICE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_inv",
        url: "https://example.com/inv.jpg",
        name: "invoice.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "EXTRACTED",
      extraction: {
        status: "EXTRACTED",
        model: "gemini-2.5-flash",
        extractedAt: new Date(),
        confidence: 0.95,
        data: {
          invoiceNumber: "INV-104",
          transactionId: "WF-TX-104",
          sellerName: "ABC Recycling Pvt Ltd",
          materialDescription: "PET Plastic",
          quantity: 560,
          quantityUnit: "kg",
          confidence: 0.95,
        },
      },
    });

    // Evidence 2: Scale 1 - UPLOADED (needs extraction)
    await EvidenceModel.create({
      evidenceId: "EVD-WF-SCALE-01",
      caseId: case1._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_s1",
        url: "https://example.com/scale1.jpg",
        name: "scale1.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "UPLOADED",
      extraction: { status: "PENDING" },
    });

    // Evidence 3: Scale 2 - UPLOADED (needs extraction)
    await EvidenceModel.create({
      evidenceId: "EVD-WF-SCALE-02",
      caseId: case1._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_s2",
        url: "https://example.com/scale2.jpg",
        name: "scale2.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "UPLOADED",
      extraction: { status: "PENDING" },
    });

    // Evidence 4: Scale 3 - UPLOADED (needs extraction)
    await EvidenceModel.create({
      evidenceId: "EVD-WF-SCALE-03",
      caseId: case1._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_s3",
        url: "https://example.com/scale3.jpg",
        name: "scale3.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "UPLOADED",
      extraction: { status: "PENDING" },
    });

    // Mock fetch for image downloads
    const originalFetch = global.fetch;
    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const urlStr = typeof input === "string" ? input : input.toString();
      if (urlStr.includes("example.com")) {
        return new Response(Buffer.from("mock image data"), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        });
      }
      return originalFetch(input, init);
    };

    // Mock GeminiExtractionService to return weights for scales:
    // Scale 1 -> 184.6 kg, Scale 2 -> 193.2 kg, Scale 3 -> 177.8 kg (Total: 555.6 kg)
    let geminiCallCount = 0;
    const originalGeminiMethod = GeminiExtractionService.generateStructuredExtraction;
    GeminiExtractionService.generateStructuredExtraction = async () => {
      geminiCallCount++;
      if (geminiCallCount === 1) {
        return JSON.stringify({ weight: 184.6, unit: "kg", confidence: 0.95 });
      } else if (geminiCallCount === 2) {
        return JSON.stringify({ weight: 193.2, unit: "kg", confidence: 0.94 });
      } else {
        return JSON.stringify({ weight: 177.8, unit: "kg", confidence: 0.96 });
      }
    };

    // Test 1: Authentication is required
    const unauthRes = await fetch(`${baseUrl}/cases/PL-WF-000101/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    assert("1. Authentication required on POST /verify", unauthRes.status === 401);

    // Test 2: Cross-user access returns 404
    const userBCrossRes = await fetch(`${baseUrl}/cases/PL-WF-000101/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-b",
      },
    });
    assert("2. User B forbidden/404 from User A case", userBCrossRes.status === 404);

    // Test 3: Complete workflow executes successfully for User A
    const verifyRes = await fetch(`${baseUrl}/cases/PL-WF-000101/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
    });
    const verifyData = (await verifyRes.json()) as any;

    assert("3. POST /verify completes with 200", verifyRes.status === 200);
    assert("4. Workflow status is COMPLETED", verifyData.data.workflowStatus === "COMPLETED");
    assert("5. Gemini called exactly 3 times (invoice was reused)", geminiCallCount === 3);
    assert("6. Measured total weight is 555.6 kg", verifyData.data.calculatedValues.measuredWeight === 555.6);
    assert("7. Overall risk is LOW", verifyData.data.overallRisk === "LOW");

    // Test 8: Workflow status progress endpoint
    const statusRes = await fetch(`${baseUrl}/cases/PL-WF-000101/verification/status`, {
      method: "GET",
      headers: { Authorization: "Bearer token-user-a" },
    });
    const statusData = (await statusRes.json()) as any;
    assert("8. GET /verification/status returns 200", statusRes.status === 200);
    assert("9. Status reports COMPLETED", statusData.data.status === "COMPLETED");
    assert("10. Status reports 4 total evidence items", statusData.data.totalEvidence === 4);

    // Test 11: Case document updated in MongoDB to VERIFICATION_COMPLETE
    const updatedCase = await CaseModel.findOne({ caseId: "PL-WF-000101" });
    assert("11. Case status in DB is VERIFICATION_COMPLETE", updatedCase?.status === "VERIFICATION_COMPLETE");
    assert("12. Case riskLevel in DB is LOW", updatedCase?.riskLevel === "LOW");

    // Test 13: Idempotency - running verify again reuses existing extractions (0 gemini calls)
    const prevCallCount = geminiCallCount;
    const rerunRes = await fetch(`${baseUrl}/cases/PL-WF-000101/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
    });
    assert("13. Re-run verification succeeds with 200", rerunRes.status === 200);
    assert("14. Re-run makes 0 additional Gemini calls (all reused)", geminiCallCount === prevCallCount);

    const findingsCount = await FindingModel.countDocuments({ caseId: case1._id });
    const verificationsCount = await VerificationModel.countDocuments({ caseId: case1._id });
    assert("15. Re-run does not create duplicate Verification documents", verificationsCount === 1);
    assert("16. Re-run does not duplicate Findings", findingsCount === 0); // Demo scenario 1 produces 0 findings

    // Test 17: Concurrency Protection
    // Create an artificial active running workflow run in DB for a case
    const caseConcurrency = await CaseModel.create({
      caseId: "PL-WF-CONCURRENT",
      userId: userA._id,
      transactionId: "WF-TX-999",
      partnerName: "Concurrent Test Partner",
      material: "Alloy",
      claimedQuantity: 100,
      unit: "kg",
      status: "PROCESSING",
    });

    await WorkflowRunModel.create({
      workflowId: "WF-PL-WF-CONCURRENT-ACTIVE",
      caseId: caseConcurrency._id,
      userId: userA._id,
      status: "RUNNING",
      currentStep: "EXTRACTION",
      startedAt: new Date(),
      updatedAt: new Date(),
    });

    const concurrentAttempt = await fetch(`${baseUrl}/cases/PL-WF-CONCURRENT/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
    });
    assert("17. Concurrent execution rejected with 409", concurrentAttempt.status === 409);

    // Test 18: Transient Failure Retry & Eventual Success
    // Set up Case with 1 pending item. Mock Gemini to fail transiently on attempt 1 with 429, then succeed on attempt 2
    const caseRetry = await CaseModel.create({
      caseId: "PL-WF-RETRY",
      userId: userA._id,
      transactionId: "WF-TX-RETRY",
      partnerName: "Retry Partner",
      material: "Copper",
      claimedQuantity: 100,
      unit: "kg",
      status: "EVIDENCE_READY",
    });

    await EvidenceModel.create({
      evidenceId: "EVD-WF-RETRY-DOC",
      caseId: caseRetry._id,
      uploadedBy: userA._id,
      type: "INVOICE",
      file: {
        provider: "imagekit",
        fileId: "ik_retry_inv",
        url: "https://example.com/retry.jpg",
        name: "retry.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 100,
      },
      status: "UPLOADED",
      extraction: { status: "PENDING" },
    });

    let retryGeminiAttempts = 0;
    GeminiExtractionService.generateStructuredExtraction = async () => {
      retryGeminiAttempts++;
      if (retryGeminiAttempts === 1) {
        throw new Error("429 Resource has been exhausted (rate limit)");
      }
      return JSON.stringify({ weight: 100, unit: "kg", confidence: 0.9 });
    };

    const retryRes = await fetch(`${baseUrl}/cases/PL-WF-RETRY/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
    });
    assert("18. Transient failure retries and succeeds with 200", retryRes.status === 200);
    assert("19. Gemini was retried", retryGeminiAttempts >= 2);

    // Test 20: Retry Exhaustion produces FAILED status
    const caseExhaust = await CaseModel.create({
      caseId: "PL-WF-EXHAUST",
      userId: userA._id,
      transactionId: "WF-TX-EXHAUST",
      partnerName: "Exhaust Partner",
      material: "Steel",
      claimedQuantity: 50,
      unit: "kg",
      status: "EVIDENCE_READY",
    });

    await EvidenceModel.create({
      evidenceId: "EVD-WF-EXHAUST-DOC",
      caseId: caseExhaust._id,
      uploadedBy: userA._id,
      type: "INVOICE",
      file: {
        provider: "imagekit",
        fileId: "ik_ex_inv",
        url: "https://example.com/exhaust.jpg",
        name: "exhaust.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 100,
      },
      status: "UPLOADED",
      extraction: { status: "PENDING" },
    });

    GeminiExtractionService.generateStructuredExtraction = async () => {
      throw new Error("429 Quota Exceeded Rate Limit");
    };

    const exhaustRes = await fetch(`${baseUrl}/cases/PL-WF-EXHAUST/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
    });
    assert("20. Retry exhaustion returns 502", exhaustRes.status === 502);

    const exhaustedRun = await WorkflowRunModel.findOne({ caseId: caseExhaust._id });
    assert("21. WorkflowRun status is FAILED after retry exhaustion", exhaustedRun?.status === "FAILED");

    // Test 22: Permanent Failure (Invalid Schema Output) Rejection
    const casePermanent = await CaseModel.create({
      caseId: "PL-WF-PERM",
      userId: userA._id,
      transactionId: "WF-TX-PERM",
      partnerName: "Perm Partner",
      material: "Glass",
      claimedQuantity: 80,
      unit: "kg",
      status: "EVIDENCE_READY",
    });

    await EvidenceModel.create({
      evidenceId: "EVD-WF-PERM-DOC",
      caseId: casePermanent._id,
      uploadedBy: userA._id,
      type: "INVOICE",
      file: {
        provider: "imagekit",
        fileId: "ik_perm_inv",
        url: "https://example.com/perm.jpg",
        name: "perm.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 100,
      },
      status: "UPLOADED",
      extraction: { status: "PENDING" },
    });

    // Returns invalid schema (quantity as string for INVOICE)
    GeminiExtractionService.generateStructuredExtraction = async () => {
      return JSON.stringify({ quantity: "not-a-number", quantityUnit: 12345 });
    };

    const permRes = await fetch(`${baseUrl}/cases/PL-WF-PERM/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
    });
    assert("22. Invalid extraction schema returns error", permRes.status >= 400);

    // Restore mocks
    global.fetch = originalFetch;
    GeminiExtractionService.generateStructuredExtraction = originalGeminiMethod;

    server.close();
    await disconnectDatabase();
  } catch (err) {
    console.error("Test execution threw exception:", err);
    failed++;
    server.close();
    await disconnectDatabase();
  }

  console.log(`\n=== PHASE 3.4 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
};

runSuite();
