import http from "http";
import admin from "firebase-admin";
import { createApp } from "../src/server";
import { connectDatabase, disconnectDatabase } from "../src/config/database";
import { UserModel } from "../src/models/user.model";
import { CaseModel } from "../src/models/case.model";
import { EvidenceModel } from "../src/models/evidence.model";
import { VerificationModel } from "../src/models/verification.model";
import { FindingModel } from "../src/models/finding.model";
import { VerificationEngine } from "../src/verification/verification.engine";
import { normalizeToKg } from "../src/verification/normalization/normalizer";

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
  console.log("=== BEGINNING PHASE 3.3 TEST SUITE ===");

  await connectDatabase();
  const app = createApp();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5095, resolve));
  const baseUrl = "http://localhost:5095";

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
    await CaseModel.deleteMany({ transactionId: /^DEMO-TX-/ });
    await EvidenceModel.deleteMany({ evidenceId: /^EVD-DEMO-/ });
    await VerificationModel.deleteMany({});
    await FindingModel.deleteMany({});

    // 1. Unit Normalization Tests
    assert("Normalize kg to kg", normalizeToKg(500, "kg")?.weightKg === 500);
    assert("Normalize grams to kg", normalizeToKg(500000, "g")?.weightKg === 500);
    assert("Normalize tonnes to kg", normalizeToKg(0.5, "tonne")?.weightKg === 500);
    assert("Normalize unsupported unit returns null", normalizeToKg(500, "unsupported_unit") === null);
    assert("Normalize null weight returns null", normalizeToKg(null, "kg") === null);

    // 2. Setup User A
    const userA = await UserModel.create({
      firebaseUid: "firebase_user_a_123",
      email: "user_a@proofline.test",
      role: "USER",
    });

    // 3. Setup DEMO SCENARIO 1: Consistent Case (555.6 kg vs 560 kg -> 0.79% variance < 2% -> LOW RISK)
    // Scale 1: 184.6 kg, Scale 2: 193.2 kg, Scale 3: 177.8 kg (Total: 555.6 kg)
    // Invoice: 560 kg, EW-104, ABC Recycling Pvt Ltd
    // Certificate: 560 kg, EW-104, ABC Recycling Pvt Ltd
    const demoCase1 = await CaseModel.create({
      caseId: "PL-EW-000124",
      userId: userA._id,
      transactionId: "EW-104",
      partnerName: "ABC Recycling Pvt Ltd",
      material: "PET Plastic",
      claimedQuantity: 560,
      unit: "kg",
      status: "EVIDENCE_READY",
    });

    const createEvidenceItem = async (params: {
      evidenceId: string;
      type: "SCALE_IMAGE" | "INVOICE" | "CERTIFICATE";
      data: Record<string, unknown>;
      status?: "EXTRACTED" | "UPLOADED";
    }) => {
      return EvidenceModel.create({
        evidenceId: params.evidenceId,
        caseId: demoCase1._id,
        uploadedBy: userA._id,
        type: params.type,
        file: {
          provider: "imagekit",
          fileId: `ik_${params.evidenceId}`,
          url: "http://localhost:5095/health",
          name: `${params.evidenceId}.jpg`,
          mimeType: "image/jpeg",
          sizeBytes: 2048,
        },
        status: params.status || "EXTRACTED",
        extraction: {
          status: "EXTRACTED",
          confidence: 0.95,
          data: params.data,
        },
      });
    };

    const s1 = await createEvidenceItem({
      evidenceId: "EVD-DEMO-S1",
      type: "SCALE_IMAGE",
      data: { weight: 184.6, unit: "kg" },
    });
    const s2 = await createEvidenceItem({
      evidenceId: "EVD-DEMO-S2",
      type: "SCALE_IMAGE",
      data: { weight: 193.2, unit: "kg" },
    });
    const s3 = await createEvidenceItem({
      evidenceId: "EVD-DEMO-S3",
      type: "SCALE_IMAGE",
      data: { weight: 177.8, unit: "kg" },
    });
    const inv = await createEvidenceItem({
      evidenceId: "EVD-DEMO-INV",
      type: "INVOICE",
      data: {
        invoiceNumber: "INV-104",
        quantity: 560,
        quantityUnit: "kg",
        sellerName: "ABC Recycling Pvt Ltd",
        transactionId: "EW-104",
      },
    });
    const cert = await createEvidenceItem({
      evidenceId: "EVD-DEMO-CERT",
      type: "CERTIFICATE",
      data: {
        certificateNumber: "CERT-104",
        quantity: 560,
        quantityUnit: "kg",
        issuerName: "ABC Recycling Pvt Ltd",
        transactionId: "EW-104",
      },
    });

    // 4. Test Pure Deterministic Engine Direct Execution & Determinism
    const engineRun1 = VerificationEngine.verify({
      caseDoc: demoCase1,
      evidenceDocs: [s1, s2, s3, inv, cert],
    });
    const engineRun2 = VerificationEngine.verify({
      caseDoc: demoCase1,
      evidenceDocs: [s1, s2, s3, inv, cert],
    });

    assert("Engine run 1 measured total is 555.6 kg", engineRun1.calculatedValues.measuredWeight === 555.6);
    assert("Engine run 1 difference is 4.4 kg", engineRun1.calculatedValues.differenceWeight === 4.4);
    assert("Engine run 1 variance is 0.79%", engineRun1.calculatedValues.variancePercentage === 0.79);
    assert("Engine run 1 overall risk is LOW", engineRun1.overallRisk === "LOW");
    assert("Engine run 1 produces 0 findings", engineRun1.findings.length === 0);
    assert("Engine evaluation is 100% deterministic", JSON.stringify(engineRun1) === JSON.stringify(engineRun2));

    // 5. Unauthenticated API request -> 401
    const unauthVerify = await fetch(`${baseUrl}/cases/${demoCase1.caseId}/verify`, { method: "POST" });
    assert("Unauthenticated POST /verify rejected with 401", unauthVerify.status === 401);

    // 6. Cross-User API request -> 404
    const userBVerify = await fetch(`${baseUrl}/cases/${demoCase1.caseId}/verify`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-b" },
    });
    assert("User B verify on User A's case blocked with 404", userBVerify.status === 404);

    // 7. Successful POST /cases/:caseId/verify for Demo Scenario 1
    const verifyRes1 = await fetch(`${baseUrl}/cases/${demoCase1.caseId}/verify`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
    });
    const verifyData1 = await verifyRes1.json();

    assert("POST /verify succeeds with 200", verifyRes1.status === 200 && verifyData1.success === true);
    assert("API response overallRisk is LOW", verifyData1.data.overallRisk === "LOW");
    assert("API response measuredWeight is 555.6 kg", verifyData1.data.calculatedValues.measuredWeight === 555.6);

    // 8. Verify MongoDB Persistence of Verification and Case Status
    const persistedVerification = await VerificationModel.findOne({ caseId: demoCase1._id });
    assert("Verification document persisted in MongoDB", persistedVerification !== null && persistedVerification.overallRisk === "LOW");

    const updatedCase1 = await CaseModel.findById(demoCase1._id);
    assert("Case status transitioned to VERIFICATION_COMPLETE", updatedCase1 !== null && updatedCase1.status === "VERIFICATION_COMPLETE");

    // 9. GET /cases/:caseId/verification
    const getVerificationRes = await fetch(`${baseUrl}/cases/${demoCase1.caseId}/verification`, {
      headers: { Authorization: "Bearer token-user-a" },
    });
    const getVerificationData = await getVerificationRes.json();
    assert(
      "GET /verification returns persisted results",
      getVerificationRes.status === 200 && getVerificationData.data.overallRisk === "LOW"
    );

    // 10. DEMO SCENARIO 2: Inconsistency Twist (Claimed 700 kg vs 555.6 kg -> 20.63% variance -> HIGH RISK)
    // Partner name mismatch on certificate + Transaction ID mismatch
    const demoCase2 = await CaseModel.create({
      caseId: "PL-EW-000125",
      userId: userA._id,
      transactionId: "EW-104",
      partnerName: "ABC Recycling Pvt Ltd",
      material: "PET Plastic",
      claimedQuantity: 700, // Claimed 700 kg
      unit: "kg",
      status: "EVIDENCE_READY",
    });

    // Attach scale images & invoice to demoCase2 so the 700 kg claimed vs 555.6 kg measured twist executes
    await EvidenceModel.create({
      evidenceId: "EVD-DEMO2-S1",
      caseId: demoCase2._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: { provider: "imagekit", fileId: "ik_s1", url: "http://localhost:5095/health", name: "s1.jpg", mimeType: "image/jpeg", sizeBytes: 1024 },
      status: "EXTRACTED",
      extraction: { status: "EXTRACTED", confidence: 0.95, data: { weight: 184.6, unit: "kg" } },
    });
    await EvidenceModel.create({
      evidenceId: "EVD-DEMO2-S2",
      caseId: demoCase2._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: { provider: "imagekit", fileId: "ik_s2", url: "http://localhost:5095/health", name: "s2.jpg", mimeType: "image/jpeg", sizeBytes: 1024 },
      status: "EXTRACTED",
      extraction: { status: "EXTRACTED", confidence: 0.95, data: { weight: 193.2, unit: "kg" } },
    });
    await EvidenceModel.create({
      evidenceId: "EVD-DEMO2-S3",
      caseId: demoCase2._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: { provider: "imagekit", fileId: "ik_s3", url: "http://localhost:5095/health", name: "s3.jpg", mimeType: "image/jpeg", sizeBytes: 1024 },
      status: "EXTRACTED",
      extraction: { status: "EXTRACTED", confidence: 0.95, data: { weight: 177.8, unit: "kg" } },
    });
    await EvidenceModel.create({
      evidenceId: "EVD-DEMO2-INV",
      caseId: demoCase2._id,
      uploadedBy: userA._id,
      type: "INVOICE",
      file: { provider: "imagekit", fileId: "ik_inv", url: "http://localhost:5095/health", name: "inv.jpg", mimeType: "image/jpeg", sizeBytes: 1024 },
      status: "EXTRACTED",
      extraction: { status: "EXTRACTED", confidence: 0.95, data: { quantity: 700, quantityUnit: "kg", sellerName: "ABC Recycling Pvt Ltd", transactionId: "EW-104" } },
    });

    const certMismatch = await EvidenceModel.create({
      evidenceId: "EVD-DEMO-CERT-MISMATCH",
      caseId: demoCase2._id,
      uploadedBy: userA._id,
      type: "CERTIFICATE",
      file: {
        provider: "imagekit",
        fileId: "ik_cert_mismatch",
        url: "http://localhost:5095/health",
        name: "cert_mismatch.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 2048,
      },
      status: "EXTRACTED",
      extraction: {
        status: "EXTRACTED",
        confidence: 0.95,
        data: {
          certificateNumber: "CERT-999",
          quantity: 560,
          quantityUnit: "kg",
          issuerName: "XYZ Recycling Pvt Ltd", // Mismatched entity
          transactionId: "EW-999", // Mismatched transaction ID
        },
      },
    });

    const verifyRes2 = await fetch(`${baseUrl}/cases/${demoCase2.caseId}/verify`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
    });
    const verifyData2 = await verifyRes2.json();

    assert("Twist scenario returns 200", verifyRes2.status === 200 && verifyData2.success === true);
    assert("Twist scenario overallRisk is HIGH", verifyData2.data.overallRisk === "HIGH");
    assert(
      "Twist scenario generated high-severity findings",
      verifyData2.data.findings.length >= 1 &&
        verifyData2.data.findings.some((f: { type: string; severity: string }) => f.type === "WEIGHT_MISMATCH" && f.severity === "HIGH")
    );

    const updatedCase2 = await CaseModel.findById(demoCase2._id);
    assert("Twist case transitioned to REVIEW_REQUIRED", updatedCase2 !== null && updatedCase2.status === "REVIEW_REQUIRED");

    // 11. Evidence Readiness Check: Case with unextracted evidence -> 400
    const demoCase3 = await CaseModel.create({
      caseId: "PL-EW-000126",
      userId: userA._id,
      transactionId: "EW-106",
      partnerName: "ABC Recycling Pvt Ltd",
      material: "PET Plastic",
      claimedQuantity: 500,
      unit: "kg",
      status: "EVIDENCE_UPLOADING",
    });

    await EvidenceModel.create({
      evidenceId: "EVD-DEMO-UNEXTRACTED",
      caseId: demoCase3._id,
      uploadedBy: userA._id,
      type: "SCALE_IMAGE",
      file: {
        provider: "imagekit",
        fileId: "ik_unext",
        url: "http://localhost:5095/health",
        name: "scale_pending.jpg",
        mimeType: "image/jpeg",
        sizeBytes: 1024,
      },
      status: "UPLOADED", // Not EXTRACTED
      extraction: { status: "PENDING" },
    });

    const unextractedVerifyRes = await fetch(`${baseUrl}/cases/${demoCase3.caseId}/verify`, {
      method: "POST",
      headers: { Authorization: "Bearer token-user-a" },
    });
    assert("Verification on unextracted evidence rejected with 400", unextractedVerifyRes.status === 400);

    // Clean test data
    await UserModel.deleteMany({ email: /@proofline\.test$/ });
    await CaseModel.deleteMany({ transactionId: /^DEMO-TX-|^EW-/ });
    await EvidenceModel.deleteMany({ evidenceId: /^EVD-DEMO-/ });
    await VerificationModel.deleteMany({});
    await FindingModel.deleteMany({});
  } finally {
    server.close();
    await disconnectDatabase();
  }

  console.log(`\n=== PHASE 3.3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED ===\n`);
  if (failed > 0) {
    process.exit(1);
  }
};

runSuite().catch((err) => {
  console.error("Test suite runtime error:", err);
  process.exit(1);
});
