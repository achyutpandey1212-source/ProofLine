import { OFFICIAL_DEMO_SCENARIO, DemoEvidenceItem } from "./demoScenario";
import { EvidenceService } from "../services/evidence.service";
import { CaseService } from "../services/case.service";
import { VerificationClientService } from "../services/verification.service";
import { CaseItem } from "../types";

export interface DemoStepProgress {
  step: "IDLE" | "CREATE_CASE" | "UPLOAD_EVIDENCE" | "START_VERIFICATION" | "COMPLETED" | "ERROR";
  message: string;
  currentEvidenceIndex?: number;
  totalEvidenceCount?: number;
  uploadedItems?: string[];
  error?: string;
  createdCase?: CaseItem;
}

export class DemoManager {
  /**
   * Loads a synthetic evidence asset as a standard browser File object
   */
  public static async loadSyntheticFile(item: DemoEvidenceItem): Promise<File> {
    const res = await fetch(item.assetPath);
    if (!res.ok) {
      throw new Error(`Failed to load synthetic evidence file ${item.fileName} (${res.status})`);
    }
    const blob = await res.blob();
    const mimeType = item.fileName.endsWith(".pdf")
      ? "application/pdf"
      : item.fileName.endsWith(".png")
      ? "image/png"
      : "image/jpeg";
    return new File([blob], item.fileName, { type: mimeType });
  }

  /**
   * Uploads all synthetic demo evidence items sequentially using the real Evidence upload API
   */
  public static async uploadAllDemoEvidence(
    caseId: string,
    onProgress?: (index: number, total: number, fileName: string) => void
  ): Promise<void> {
    const total = OFFICIAL_DEMO_SCENARIO.evidence.length;

    for (let i = 0; i < total; i++) {
      const item = OFFICIAL_DEMO_SCENARIO.evidence[i];
      if (onProgress) {
        onProgress(i + 1, total, item.fileName);
      }
      const file = await this.loadSyntheticFile(item);
      await EvidenceService.uploadEvidence(caseId, file, item.type);
    }
  }

  /**
   * Executes the full end-to-end demo:
   * Create Case -> Upload Evidence -> Start Verification
   */
  public static async runFullDemo(
    onProgressUpdate: (state: DemoStepProgress) => void
  ): Promise<CaseItem> {
    try {
      // 1. Create Case
      onProgressUpdate({
        step: "CREATE_CASE",
        message: "Creating demo transaction case (EW-104)...",
      });

      const createdCase = await CaseService.createCase({
        transactionId: OFFICIAL_DEMO_SCENARIO.caseData.transactionId,
        partnerName: OFFICIAL_DEMO_SCENARIO.caseData.partnerName,
        material: OFFICIAL_DEMO_SCENARIO.caseData.material,
        claimedQuantity: OFFICIAL_DEMO_SCENARIO.caseData.claimedQuantity,
        unit: OFFICIAL_DEMO_SCENARIO.caseData.unit,
        organization: OFFICIAL_DEMO_SCENARIO.caseData.organization,
        notes: OFFICIAL_DEMO_SCENARIO.caseData.notes,
      });

      // 2. Upload Evidence
      onProgressUpdate({
        step: "UPLOAD_EVIDENCE",
        message: "Loading and uploading synthetic evidence files...",
        createdCase,
        totalEvidenceCount: OFFICIAL_DEMO_SCENARIO.evidence.length,
        currentEvidenceIndex: 0,
        uploadedItems: [],
      });

      const uploaded: string[] = [];
      await this.uploadAllDemoEvidence(createdCase.caseId, (curr, total, name) => {
        uploaded.push(name);
        onProgressUpdate({
          step: "UPLOAD_EVIDENCE",
          message: `Uploading evidence ${curr}/${total}: ${name}`,
          createdCase,
          totalEvidenceCount: total,
          currentEvidenceIndex: curr,
          uploadedItems: [...uploaded],
        });
      });

      // 3. Start Verification
      onProgressUpdate({
        step: "START_VERIFICATION",
        message: "Triggering real verification workflow...",
        createdCase,
      });

      await VerificationClientService.startVerification(createdCase.caseId);

      onProgressUpdate({
        step: "COMPLETED",
        message: "Full demo initialized successfully. Real pipeline is active.",
        createdCase,
      });

      return createdCase;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      onProgressUpdate({
        step: "ERROR",
        message: `Demo execution failed: ${errMsg}`,
        error: errMsg,
      });
      throw err;
    }
  }
}
