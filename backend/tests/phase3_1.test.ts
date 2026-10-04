import http from "http";
import admin from "firebase-admin";
import { createApp } from "../src/server";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { UserModel } from "../src/models/user.model";
import { CaseModel } from "../src/models/case.model";
import { EvidenceModel } from "../src/models/evidence.model";
import { ImageKitService, ImageKitUploadResult } from "../src/services/imagekit.service";

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
  console.log("=== BEGINNING PHASE 3.1 TEST SUITE ===");

  await connectDatabase();
  const app = createApp();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5097, resolve));
  const baseUrl = "http://localhost:5097";

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
    await CaseModel.deleteMany({ transactionId: /^TEST-P31-/ });
    await EvidenceModel.deleteMany({ "file.name": /^test_/ });

    // 1. Setup Case A for User A
    const createCaseRes = await fetch(`${baseUrl}/cases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-user-a",
      },
      body: JSON.stringify({
        transactionId: "TEST-P31-100",
        partnerName: "Green Recycling Hub",
        material: "PET Plastic",
        claimedQuantity: 560,
        unit: "kg",
      }),
    });
    const caseData = await createCaseRes.json();
    const caseAId = caseData.data.id;
    const caseAHumanId = caseData.data.caseId;
    assert("Case A created for User A", createCaseRes.status === 201 && !!caseAId);

    // 2. Unauthenticated upload -> 401
    const unauthUploadRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      method: "POST",
    });
    assert("Unauthenticated upload rejected with 401", unauthUploadRes.status === 401);

    // 3. User B (different user) attempts upload to Case A -> 404 (BLOCKED)
    const formDataUserB = new FormData();
    formDataUserB.append("type", "SCALE_IMAGE");
    formDataUserB.append("file", new Blob(["fake image data"], { type: "image/jpeg" }), "scale1.jpg");

    const userBUploadRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-b" },
      body: formDataUserB,
    });
    assert("User B upload to User A's case blocked with 404", userBUploadRes.status === 404);

    // 4. File Validation: Unsupported MIME type -> 415
    const unsupportedMimeForm = new FormData();
    unsupportedMimeForm.append("type", "SCALE_IMAGE");
    unsupportedMimeForm.append("file", new Blob(["#!/bin/sh\necho hack"], { type: "application/x-sh" }), "script.sh");

    const unsupportedMimeRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
      body: unsupportedMimeForm,
    });
    assert("Unsupported MIME type rejected with 415", unsupportedMimeRes.status === 415);

    // 5. File Validation: Invalid Evidence Type -> 400
    const invalidTypeForm = new FormData();
    invalidTypeForm.append("type", "INVALID_TYPE_ENUM");
    invalidTypeForm.append("file", new Blob(["dummy content"], { type: "image/jpeg" }), "valid.jpg");

    const invalidTypeRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
      body: invalidTypeForm,
    });
    assert("Invalid evidence type enum rejected with 400", invalidTypeRes.status === 400);

    // 6. Successful Evidence Upload with Mocked ImageKit
    const originalUpload = ImageKitService.uploadFile;
    const uploadedFileIds: string[] = [];

    ImageKitService.uploadFile = async (params: {
      fileBuffer: Buffer;
      fileName: string;
      caseId: string;
    }): Promise<ImageKitUploadResult> => {
      const mockId = `ik_mock_${Date.now()}`;
      uploadedFileIds.push(mockId);
      return {
        fileId: mockId,
        url: `https://ik.imagekit.io/proofline/mock/${params.fileName}`,
        name: params.fileName,
        size: params.fileBuffer.length,
        filePath: `/proofline/cases/${params.caseId}/evidence/${params.fileName}`,
      };
    };

    const validUploadForm = new FormData();
    validUploadForm.append("type", "SCALE_IMAGE");
    validUploadForm.append(
      "file",
      new Blob([Buffer.from("fake binary scale image 184.6 kg")], { type: "image/jpeg" }),
      "test_scale_01.jpg"
    );

    const validUploadRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
      body: validUploadForm,
    });
    const validUploadData = await validUploadRes.json();
    assert(
      "Valid upload returns 201 with Evidence metadata",
      validUploadRes.status === 201 &&
        validUploadData.success === true &&
        validUploadData.data.type === "SCALE_IMAGE" &&
        validUploadData.data.status === "UPLOADED" &&
        validUploadData.data.file.url.includes("test_scale_01.jpg")
    );

    // 7. Verification of MongoDB Persistence & Case Status Update
    const persistedDoc = await EvidenceModel.findOne({ evidenceId: validUploadData.data.evidenceId });
    assert(
      "Evidence document persisted in MongoDB with correct references",
      persistedDoc !== null &&
        persistedDoc.type === "SCALE_IMAGE" &&
        persistedDoc.file.mimeType === "image/jpeg"
    );

    const updatedCase = await CaseModel.findById(caseAId);
    assert(
      "Case status transitioned to EVIDENCE_UPLOADING",
      updatedCase !== null && updatedCase.status === "EVIDENCE_UPLOADING"
    );

    // 8. Evidence Retrieval: GET /cases/:id/evidence
    const getEvidenceRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      headers: { Authorization: "Bearer token-user-a" },
    });
    const getEvidenceData = await getEvidenceRes.json();
    assert(
      "User A retrieves evidence list for Case A",
      getEvidenceRes.status === 200 &&
        getEvidenceData.data.length >= 1 &&
        getEvidenceData.data.some((e: { evidenceId: string }) => e.evidenceId === validUploadData.data.evidenceId)
    );

    // 9. Cross-User Evidence Retrieval: User B attempts GET /cases/:id/evidence -> 404
    const userBGetEvidenceRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      headers: { Authorization: "Bearer token-user-b" },
    });
    assert(
      "User B querying User A's case evidence is BLOCKED with 404",
      userBGetEvidenceRes.status === 404
    );

    // 10. Failure Handling: ImageKit upload fails -> returns 502, no Evidence created
    ImageKitService.uploadFile = async () => {
      throw new Error("Simulated ImageKit provider timeout");
    };

    const failUploadForm = new FormData();
    failUploadForm.append("type", "INVOICE");
    failUploadForm.append("file", new Blob(["invoice content"], { type: "application/pdf" }), "test_inv.pdf");

    const failUploadRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
      body: failUploadForm,
    });
    assert("ImageKit failure returns 502", failUploadRes.status === 502);

    const invDoc = await EvidenceModel.findOne({ "file.name": "test_inv.pdf" });
    assert("No Evidence document created when ImageKit fails", invDoc === null);

    // 11. Failure Handling & Atomicity: ImageKit succeeds, MongoDB fails -> ImageKit deletion cleanup triggered
    let cleanupTriggeredWithId: string | null = null;
    const originalDelete = ImageKitService.deleteFile;
    ImageKitService.deleteFile = async (fileId: string) => {
      cleanupTriggeredWithId = fileId;
    };

    ImageKitService.uploadFile = async (): Promise<ImageKitUploadResult> => {
      return {
        fileId: "ik_orphan_cleanup_test_99",
        url: "https://ik.imagekit.io/proofline/orphan.jpg",
        name: "orphan.jpg",
        size: 100,
        filePath: "/proofline/orphan.jpg",
      };
    };

    // Temporarily trigger database failure on EvidenceModel.create
    const originalCreate = EvidenceModel.create;
    EvidenceModel.create = (async () => {
      throw new Error("Simulated MongoDB write collision");
    }) as unknown as typeof EvidenceModel.create;

    const atomicityForm = new FormData();
    atomicityForm.append("type", "RECEIPT");
    atomicityForm.append("file", new Blob(["receipt data"], { type: "image/png" }), "test_receipt.png");

    const atomicityRes = await fetch(`${baseUrl}/cases/${caseAId}/evidence`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
      body: atomicityForm,
    });

    assert("Database failure after ImageKit returns 500", atomicityRes.status === 500);
    assert(
      "Cleanup rollback deleted orphaned file from ImageKit",
      cleanupTriggeredWithId === "ik_orphan_cleanup_test_99"
    );

    // Restore original methods
    ImageKitService.uploadFile = originalUpload;
    ImageKitService.deleteFile = originalDelete;
    EvidenceModel.create = originalCreate;

    // Clean test data
    await UserModel.deleteMany({ email: /@proofline\.test$/ });
    await CaseModel.deleteMany({ transactionId: /^TEST-P31-/ });
    await EvidenceModel.deleteMany({ "file.name": /^test_/ });
  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log(`\n=== PHASE 3.1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error("Test suite runtime error:", err);
  process.exit(1);
});
