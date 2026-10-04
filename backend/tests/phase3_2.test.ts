import http from "http";
import admin from "firebase-admin";
import { createApp } from "../src/server";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { UserModel } from "../src/models/user.model";
import { CaseModel } from "../src/models/case.model";
import { EvidenceModel } from "../src/models/evidence.model";
import { GeminiExtractionService } from "../src/services/geminiExtraction.service";

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
  console.log("=== BEGINNING PHASE 3.2 TEST SUITE ===");

  await connectDatabase();
  const app = createApp();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5096, resolve));
  const baseUrl = "http://localhost:5096";

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
    await CaseModel.deleteMany({ transactionId: /^TEST-P32-/ });
    await EvidenceModel.deleteMany({ "file.name": /^test_p32_/ });

    // 1. Setup User A, Case A, Evidence A (Scale Image)
    const userA = await UserModel.create({
      firebaseUid: "firebase_user_a_123",
      email: "user_a@proofline.test",
      role: "USER",
    });

    const caseA = await CaseModel.create({
      caseId: "PL-TESTP32-001",
      userId: userA._id,
      transactionId: "TEST-P32-001",
      partnerName: "EcoRecycle Corp",
      material: "PET Plastic",
      claimedQuantity: 560,
      unit: "kg",
      status: "EVIDENCE_UPLOADING",
    });

    const evidenceA = await EvidenceModel.create({
      evidenceId: "EVD-P32-001",
      caseId: caseA._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_p32_1",
        url: "http://localhost:5096/health", // valid reachable URL returning dummy payload
        name: "test_p32_scale1.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "UPLOADED",
    });

    // 2. Unauthenticated extract request -> 401
    const unauthRes = await fetch(`${baseUrl}/cases/${caseA.caseId}/evidence/${evidenceA.evidenceId}/extract`, {
      method: "POST",
    });
    assert("Unauthenticated extraction rejected with 401", unauthRes.status === 401);

    // 3. User B (different user) attempts extraction on User A's evidence -> 404 (BLOCKED)
    const userBRes = await fetch(`${baseUrl}/cases/${caseA.caseId}/evidence/${evidenceA.evidenceId}/extract`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-b" },
    });
    assert("User B extraction on User A's evidence is BLOCKED with 404", userBRes.status === 404);

    // 4. Successful extraction with mocked Gemini
    const originalGenerate = GeminiExtractionService.generateStructuredExtraction;
    GeminiExtractionService.generateStructuredExtraction = async () => {
      return JSON.stringify({
        weight: 184.6,
        unit: "kg",
        date: "2026-10-04",
        time: "14:32:11",
        scaleIdentifier: "SCALE-01",
        visibleText: "GROSS 184.6 kg",
        confidence: 0.95,
        warnings: [],
      });
    };

    const extractRes = await fetch(`${baseUrl}/cases/${caseA.caseId}/evidence/${evidenceA.evidenceId}/extract`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
    });
    const extractData = await extractRes.json();
    assert(
      "Extraction succeeds and returns 200 with structured data",
      extractRes.status === 200 &&
        extractData.success === true &&
        extractData.data.extraction.status === "EXTRACTED" &&
        extractData.data.extraction.data.weight === 184.6 &&
        extractData.data.extraction.data.unit === "kg"
    );

    // 5. Verify MongoDB persistence
    const updatedEvidenceDoc = await EvidenceModel.findById(evidenceA._id);
    assert(
      "Evidence document updated in MongoDB with EXTRACTED status and model data",
      updatedEvidenceDoc !== null &&
        updatedEvidenceDoc.status === "EXTRACTED" &&
        updatedEvidenceDoc.extraction.status === "EXTRACTED" &&
        (updatedEvidenceDoc.extraction.data as { weight: number }).weight === 184.6
    );

    // 6. No-guessing / uncertainty handling: Nullable fields accepted
    GeminiExtractionService.generateStructuredExtraction = async () => {
      return JSON.stringify({
        weight: null,
        unit: null,
        date: null,
        time: null,
        scaleIdentifier: null,
        visibleText: null,
        confidence: 0.35,
        warnings: ["Scale display obscured by reflection"],
      });
    };

    const evidenceB = await EvidenceModel.create({
      evidenceId: "EVD-P32-002",
      caseId: caseA._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_p32_2",
        url: "http://localhost:5096/health",
        name: "test_p32_scale2.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "UPLOADED",
    });

    const extractUncertainRes = await fetch(`${baseUrl}/cases/${caseA.caseId}/evidence/${evidenceB.evidenceId}/extract`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
    });
    const extractUncertainData = await extractUncertainRes.json();
    assert(
      "Uncertain/missing fields handled safely with nulls and warnings",
      extractUncertainRes.status === 200 &&
        extractUncertainData.data.extraction.data.weight === null &&
        extractUncertainData.data.extraction.confidence === 0.35 &&
        extractUncertainData.data.extraction.warnings.length === 1
    );

    // 7. Schema Validation Rejection: Invalid Gemini output is NOT persisted as completed
    GeminiExtractionService.generateStructuredExtraction = async () => {
      return JSON.stringify({
        weight: "not-a-number", // violates schema: number | null
        unit: 12345, // violates schema: string | null
      });
    };

    const evidenceC = await EvidenceModel.create({
      evidenceId: "EVD-P32-003",
      caseId: caseA._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_p32_3",
        url: "http://localhost:5096/health",
        name: "test_p32_scale3.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "UPLOADED",
    });

    const invalidExtractRes = await fetch(`${baseUrl}/cases/${caseA.caseId}/evidence/${evidenceC.evidenceId}/extract`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
    });
    assert("Invalid model schema rejected with 502", invalidExtractRes.status === 502);

    const docC = await EvidenceModel.findById(evidenceC._id);
    assert(
      "Evidence marked as EXTRACTION_FAILED rather than remaining PROCESSING",
      docC !== null && docC.status === "EXTRACTION_FAILED" && docC.extraction.status === "FAILED"
    );

    // 8. Concurrency Protection: If status is PROCESSING, subsequent call is rejected with 409
    const evidenceD = await EvidenceModel.create({
      evidenceId: "EVD-P32-004",
      caseId: caseA._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_file_p32_4",
        url: "http://localhost:5096/health",
        name: "test_p32_scale4.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "PROCESSING",
    });

    const concurrentRes = await fetch(`${baseUrl}/cases/${caseA.caseId}/evidence/${evidenceD.evidenceId}/extract`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
    });
    assert("Duplicate extraction on PROCESSING evidence rejected with 409", concurrentRes.status === 409);

    // Restore original mock
    GeminiExtractionService.generateStructuredExtraction = originalGenerate;

    // Clean test data
    await UserModel.deleteMany({ email: /@proofline\.test$/ });
    await CaseModel.deleteMany({ transactionId: /^TEST-P32-/ });
    await EvidenceModel.deleteMany({ "file.name": /^test_p32_/ });
  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log(`\n=== PHASE 3.2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error("Test suite runtime error:", err);
  process.exit(1);
});
