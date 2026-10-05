import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OFFICIAL_DEMO_SCENARIO } from "./demoScenario";
import { DemoManager } from "./demoRunner";
import { CaseService } from "../services/case.service";
import { EvidenceService } from "../services/evidence.service";
import { VerificationClientService } from "../services/verification.service";
import { CaseItem, EvidenceType } from "../types";

export type DemoStep =
  | "IDLE"
  | "NAVIGATING_NEW_CASE"
  | "TYPING_FORM"
  | "SUBMITTING_CASE"
  | "UPLOADING_EVIDENCE"
  | "RUNNING_VERIFICATION"
  | "LANDING_REPORT";

export interface DemoFormData {
  transactionId: string;
  partnerName: string;
  material: string;
  claimedQuantity: string;
  unit: string;
  organization: string;
  notes: string;
}

export interface DemoState {
  isActive: boolean;
  step: DemoStep;
  currentMessage: string;
  subMessage?: string;
  activeField?: keyof DemoFormData;
  formData: DemoFormData;
  highlightSubmitButton: boolean;
  highlightVerifyButton: boolean;
  currentEvidenceType?: EvidenceType;
  currentEvidenceName?: string;
  uploadedCount: number;
  totalUploads: number;
  caseItem: CaseItem | null;
}

interface DemoContextValue {
  demoState: DemoState;
  startInteractiveDemo: () => Promise<void>;
  cancelInteractiveDemo: () => void;
}

const initialFormData: DemoFormData = {
  transactionId: "",
  partnerName: "",
  material: "",
  claimedQuantity: "",
  unit: "kg",
  organization: "",
  notes: "",
};

const initialDemoState: DemoState = {
  isActive: false,
  step: "IDLE",
  currentMessage: "",
  formData: initialFormData,
  highlightSubmitButton: false,
  highlightVerifyButton: false,
  uploadedCount: 0,
  totalUploads: 5,
  caseItem: null,
};

const DemoContext = createContext<DemoContextValue>({
  demoState: initialDemoState,
  startInteractiveDemo: async () => {},
  cancelInteractiveDemo: () => {},
});

export const useInteractiveDemo = () => useContext(DemoContext);

export const InteractiveDemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [demoState, setDemoState] = useState<DemoState>(initialDemoState);
  const abortRef = useRef(false);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const cancelInteractiveDemo = useCallback(() => {
    abortRef.current = true;
    setDemoState(initialDemoState);
  }, []);

  const startInteractiveDemo = useCallback(async () => {
    abortRef.current = false;

    try {
      // -------------------------------------------------------------
      // ACT 1: CASE INTAKE
      // -------------------------------------------------------------
      setDemoState({
        ...initialDemoState,
        isActive: true,
        step: "NAVIGATING_NEW_CASE",
        currentMessage: "Navigating to Case Intake...",
        subMessage: "Establishing baseline transaction declaration",
        totalUploads: OFFICIAL_DEMO_SCENARIO.evidence.length,
      });

      navigate("/cases/new");
      await sleep(1300);
      if (abortRef.current) return;

      // Progressive typing simulation
      const currentForm: DemoFormData = {
        transactionId: "",
        partnerName: "",
        material: "",
        claimedQuantity: "",
        unit: "kg",
        organization: "",
        notes: "",
      };

      const scenario = OFFICIAL_DEMO_SCENARIO;

      // Field 1: Transaction ID: EW-104
      setDemoState((prev) => ({
        ...prev,
        step: "TYPING_FORM",
        activeField: "transactionId",
        currentMessage: "Declaring Transaction ID: EW-104",
        subMessage: "Entering baseline transaction identifier",
      }));
      await sleep(350);

      for (const char of scenario.caseData.transactionId) {
        if (abortRef.current) return;
        currentForm.transactionId += char;
        setDemoState((prev) => ({
          ...prev,
          formData: { ...currentForm },
        }));
        await sleep(140);
      }
      await sleep(400);

      // Field 2: Partner / Seller: NexCycle Polymers Private Limited
      setDemoState((prev) => ({
        ...prev,
        activeField: "partnerName",
        currentMessage: "Declaring Counterparty: NexCycle Polymers Private Limited",
        subMessage: "Bhiwandi, Maharashtra — Authorized Recycling Facility",
      }));
      await sleep(300);

      for (const char of scenario.caseData.partnerName) {
        if (abortRef.current) return;
        currentForm.partnerName += char;
        setDemoState((prev) => ({
          ...prev,
          formData: { ...currentForm },
        }));
        await sleep(45);
      }
      await sleep(400);

      // Field 3: Material: Washed PET Flakes — Clear Grade
      setDemoState((prev) => ({
        ...prev,
        activeField: "material",
        currentMessage: "Declaring Material: Washed PET Flakes — Clear Grade",
        subMessage: "Industrial post-consumer recycled specification",
      }));
      await sleep(300);

      for (const char of scenario.caseData.material) {
        if (abortRef.current) return;
        currentForm.material += char;
        setDemoState((prev) => ({
          ...prev,
          formData: { ...currentForm },
        }));
        await sleep(45);
      }
      await sleep(400);

      // Field 4: Claimed Quantity: 560
      setDemoState((prev) => ({
        ...prev,
        activeField: "claimedQuantity",
        currentMessage: "Declaring Claimed Quantity: 560.00 kg",
        subMessage: "Invoiced consignment weight baseline",
      }));
      await sleep(300);

      for (const char of String(scenario.caseData.claimedQuantity)) {
        if (abortRef.current) return;
        currentForm.claimedQuantity += char;
        setDemoState((prev) => ({
          ...prev,
          formData: { ...currentForm },
        }));
        await sleep(120);
      }
      currentForm.unit = "kg";
      setDemoState((prev) => ({
        ...prev,
        formData: { ...currentForm },
      }));
      await sleep(400);

      // Field 5: Organization (Buyer)
      setDemoState((prev) => ({
        ...prev,
        activeField: "organization",
        currentMessage: "Declaring Buyer: Ardent Packaging Industries Private Limited",
        subMessage: "Taloja, Navi Mumbai, Maharashtra",
      }));
      await sleep(300);

      for (const char of scenario.caseData.organization) {
        if (abortRef.current) return;
        currentForm.organization += char;
        setDemoState((prev) => ({
          ...prev,
          formData: { ...currentForm },
        }));
        await sleep(35);
      }
      await sleep(350);

      // Field 6: Logistics Context & Notes
      setDemoState((prev) => ({
        ...prev,
        activeField: "notes",
        currentMessage: "Declaring Logistics Context...",
        subMessage: "Vehicle MH 04 KT 7821 • Batch NXP-PET-261004-B17 • Invoice NXP/26-27/0184",
      }));
      await sleep(300);

      currentForm.notes = scenario.caseData.notes;
      setDemoState((prev) => ({
        ...prev,
        formData: { ...currentForm },
      }));
      await sleep(700);

      // Highlight Submit Button
      setDemoState((prev) => ({
        ...prev,
        activeField: undefined,
        highlightSubmitButton: true,
        currentMessage: "Transaction declaration complete. Proceeding to intake workspace...",
        subMessage: "Registering baseline case in Proofline engine",
      }));
      await sleep(950);
      if (abortRef.current) return;

      // Real backend case creation with isDemo: true
      setDemoState((prev) => ({
        ...prev,
        step: "SUBMITTING_CASE",
        highlightSubmitButton: false,
      }));

      const created = await CaseService.createCase({
        transactionId: scenario.caseData.transactionId,
        partnerName: scenario.caseData.partnerName,
        material: scenario.caseData.material,
        claimedQuantity: scenario.caseData.claimedQuantity,
        unit: scenario.caseData.unit,
        organization: scenario.caseData.organization,
        notes: scenario.caseData.notes,
        isDemo: true,
      });

      if (abortRef.current) return;

      setDemoState((prev) => ({
        ...prev,
        caseItem: created,
        currentMessage: `Case ${created.caseId} registered. Opening Evidence Workspace...`,
        subMessage: "Preparing sequential evidentiary document intake",
      }));

      navigate(`/cases/${created.caseId}`);
      await sleep(1300);
      if (abortRef.current) return;

      // -------------------------------------------------------------
      // ACT 2: SEQUENTIAL EVIDENCE INTAKE
      // -------------------------------------------------------------
      const totalEvidence = scenario.evidence.length;
      for (let i = 0; i < totalEvidence; i++) {
        if (abortRef.current) return;
        const item = scenario.evidence[i];

        const itemFriendlyTitle =
          item.type === "INVOICE"
            ? "Commercial Tax Invoice (560.00 kg)"
            : item.type === "CERTIFICATE"
            ? "Certificate of Analysis (Purity 99.2%)"
            : `Weighbridge Ticket ${i} (${item.expectedWeight?.toFixed(2)} kg)`;

        setDemoState((prev) => ({
          ...prev,
          step: "UPLOADING_EVIDENCE",
          currentEvidenceType: item.type,
          currentEvidenceName: item.fileName,
          uploadedCount: i,
          totalUploads: totalEvidence,
          currentMessage: `Ingesting Document [${i + 1}/${totalEvidence}]: ${itemFriendlyTitle}`,
          subMessage: item.description,
        }));

        await sleep(550);
        if (abortRef.current) return;

        // Load and upload actual file from public/demo/
        const file = await DemoManager.loadSyntheticFile(item);
        await EvidenceService.uploadEvidence(created.caseId, file, item.type);

        // Notify UI to immediately render newly uploaded document row
        window.dispatchEvent(
          new CustomEvent("proofline:evidence-added", {
            detail: { fileName: item.fileName, type: item.type },
          })
        );

        setDemoState((prev) => ({
          ...prev,
          uploadedCount: i + 1,
          currentMessage: `Registered [${i + 1}/${totalEvidence}]: ${item.fileName}`,
          subMessage: `${item.type.replace(/_/g, " ")} • Document Fingerprinted & Indexed`,
        }));

        // Give viewer time to see the document inside the evidence table
        await sleep(1250);
      }

      if (abortRef.current) return;

      // -------------------------------------------------------------
      // ACT 3: TRIGGER REAL VERIFICATION PIPELINE
      // -------------------------------------------------------------
      await sleep(800);
      setDemoState((prev) => ({
        ...prev,
        highlightVerifyButton: true,
        currentMessage: "All 5 evidentiary records registered. Initiating Verification...",
        subMessage: "Executing multimodal extraction, mass balance reconciliation & integrity checks",
      }));

      await sleep(1100);
      if (abortRef.current) return;

      setDemoState((prev) => ({
        ...prev,
        step: "RUNNING_VERIFICATION",
        highlightVerifyButton: false,
      }));

      navigate(`/cases/${created.caseId}/verify`);

      // Monitor verification status as VerificationFlowPage runs
      let isVerified = false;
      const startTime = Date.now();
      while (!isVerified && Date.now() - startTime < 180000) {
        if (abortRef.current) return;
        await sleep(1400);
        try {
          const statusRes = await VerificationClientService.getStatus(created.caseId);
          if (statusRes.status === "COMPLETED") {
            isVerified = true;
          }
        } catch {
          // Poll continuation
        }
      }

      if (abortRef.current) return;

      // -------------------------------------------------------------
      // ACT 4: LAND ON REAL AUDIT REPORT & LET IT BREATHE
      // -------------------------------------------------------------
      setDemoState((prev) => ({
        ...prev,
        step: "LANDING_REPORT",
        currentMessage: "Verification Complete — Claim Verified (Low Risk)",
        subMessage: "Claimed: 560.00 kg • Measured: 555.60 kg • Variance: 0.79%",
      }));

      await sleep(1800);
      navigate(`/cases/${created.caseId}/verification?demo=true`);

      // Let report breathe for 4.5 seconds so viewer absorbs the complete verified result
      await sleep(4500);

      // Return demo state to peaceful idle, ready for optional second act
      setDemoState((prev) => ({
        ...prev,
        isActive: false,
        step: "IDLE",
      }));
    } catch (err) {
      console.error("Interactive demo error:", err);
      setDemoState(initialDemoState);
    }
  }, [navigate]);

  return (
    <DemoContext.Provider
      value={{
        demoState,
        startInteractiveDemo,
        cancelInteractiveDemo,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
};
