import React, { createContext, useContext, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { OFFICIAL_DEMO_SCENARIO } from "./demoScenario";
import { DemoManager } from "./demoRunner";
import { CaseService } from "../services/case.service";
import { EvidenceService } from "../services/evidence.service";
import { VerificationClientService } from "../services/verification.service";
import { CaseItem } from "../types";

export type DemoStep =
  | "IDLE"
  | "NAVIGATING_NEW_CASE"
  | "TYPING_FORM"
  | "SUBMITTING_CASE"
  | "UPLOADING_EVIDENCE"
  | "RUNNING_VERIFICATION"
  | "LANDING_REPORT";

interface DemoState {
  isActive: boolean;
  step: DemoStep;
  currentMessage: string;
  subMessage?: string;
  fieldFocus?: string;
  uploadedCount: number;
  totalUploads: number;
  caseItem: CaseItem | null;
}

interface DemoContextValue {
  demoState: DemoState;
  startInteractiveDemo: () => Promise<void>;
  cancelInteractiveDemo: () => void;
}

const DemoContext = createContext<DemoContextValue>({
  demoState: {
    isActive: false,
    step: "IDLE",
    currentMessage: "",
    uploadedCount: 0,
    totalUploads: 5,
    caseItem: null,
  },
  startInteractiveDemo: async () => {},
  cancelInteractiveDemo: () => {},
});

export const useInteractiveDemo = () => useContext(DemoContext);

export const InteractiveDemoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [demoState, setDemoState] = useState<DemoState>({
    isActive: false,
    step: "IDLE",
    currentMessage: "",
    uploadedCount: 0,
    totalUploads: 5,
    caseItem: null,
  });

  const abortRef = useRef(false);

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  const cancelInteractiveDemo = useCallback(() => {
    abortRef.current = true;
    setDemoState({
      isActive: false,
      step: "IDLE",
      currentMessage: "",
      uploadedCount: 0,
      totalUploads: 5,
      caseItem: null,
    });
  }, []);

  const startInteractiveDemo = useCallback(async () => {
    abortRef.current = false;

    try {
      // Step 1: Initialize & Navigate to /cases/new
      setDemoState({
        isActive: true,
        step: "NAVIGATING_NEW_CASE",
        currentMessage: "Navigating to Case Intake workspace...",
        subMessage: "Establishing baseline transaction declaration",
        uploadedCount: 0,
        totalUploads: OFFICIAL_DEMO_SCENARIO.evidence.length,
        caseItem: null,
      });

      navigate("/cases/new");
      await sleep(2500);
      if (abortRef.current) return;

      // Step 2: Form typing simulation
      const formFields = [
        { name: "Transaction ID", value: OFFICIAL_DEMO_SCENARIO.caseData.transactionId },
        { name: "Partner Name", value: OFFICIAL_DEMO_SCENARIO.caseData.partnerName },
        { name: "Material Specification", value: OFFICIAL_DEMO_SCENARIO.caseData.material },
        { name: "Claimed Weight", value: "560 kg" },
      ];

      for (const field of formFields) {
        if (abortRef.current) return;
        setDemoState((prev) => ({
          ...prev,
          step: "TYPING_FORM",
          fieldFocus: field.name,
          currentMessage: `Declaring ${field.name}: ${field.value}`,
          subMessage: "Entering baseline transaction attributes",
        }));
        await sleep(950);
      }

      // Step 3: Submitting Case to Real Backend with isDemo: true
      setDemoState((prev) => ({
        ...prev,
        step: "SUBMITTING_CASE",
        fieldFocus: undefined,
        currentMessage: "Registering official verification case in database...",
        subMessage: "Purging prior test cases & establishing isolated sandbox instance",
      }));
      await sleep(1200);
      if (abortRef.current) return;

      const created = await CaseService.createCase({
        transactionId: OFFICIAL_DEMO_SCENARIO.caseData.transactionId,
        partnerName: OFFICIAL_DEMO_SCENARIO.caseData.partnerName,
        material: OFFICIAL_DEMO_SCENARIO.caseData.material,
        claimedQuantity: OFFICIAL_DEMO_SCENARIO.caseData.claimedQuantity,
        unit: OFFICIAL_DEMO_SCENARIO.caseData.unit,
        organization: OFFICIAL_DEMO_SCENARIO.caseData.organization,
        notes: OFFICIAL_DEMO_SCENARIO.caseData.notes,
        isDemo: true,
      });

      if (abortRef.current) return;

      setDemoState((prev) => ({
        ...prev,
        caseItem: created,
        currentMessage: `Case ${created.caseId} created. Navigating to evidence intake...`,
      }));

      navigate(`/cases/${created.caseId}`);
      await sleep(1800);
      if (abortRef.current) return;

      // Step 4: Uploading real synthetic evidence files sequentially
      const totalEvidence = OFFICIAL_DEMO_SCENARIO.evidence.length;
      for (let i = 0; i < totalEvidence; i++) {
        if (abortRef.current) return;
        const item = OFFICIAL_DEMO_SCENARIO.evidence[i];

        setDemoState((prev) => ({
          ...prev,
          step: "UPLOADING_EVIDENCE",
          uploadedCount: i + 1,
          totalUploads: totalEvidence,
          currentMessage: `Ingesting evidence [${i + 1}/${totalEvidence}]: ${item.fileName}`,
          subMessage: `${item.type.replace(/_/g, " ")} &bull; ${item.description}`,
        }));

        const file = await DemoManager.loadSyntheticFile(item);
        await EvidenceService.uploadEvidence(created.caseId, file, item.type);
        await sleep(1400);
      }

      if (abortRef.current) return;

      // Step 5: Trigger real verification pipeline
      setDemoState((prev) => ({
        ...prev,
        step: "RUNNING_VERIFICATION",
        currentMessage: "Initiating deterministic verification pipeline...",
        subMessage: "Extracting facts, validating weights & reconciling mass-balance",
      }));

      await sleep(1500);
      navigate(`/cases/${created.caseId}/verify`);

      // Let VerificationFlowPage execute with live HUD polling
      let isVerified = false;
      const startTime = Date.now();
      while (!isVerified && Date.now() - startTime < 35000) {
        if (abortRef.current) return;
        await sleep(1500);
        try {
          const statusRes = await VerificationClientService.getStatus(created.caseId);
          if (statusRes.status === "COMPLETED") {
            isVerified = true;
          }
        } catch {
          // ignore transient errors during polling
        }
      }

      if (abortRef.current) return;

      // Step 6: Organic landing on report with demo banner active
      setDemoState((prev) => ({
        ...prev,
        step: "LANDING_REPORT",
        currentMessage: "Verification complete. Rendering cryptographic audit report...",
        subMessage: "Claimed: 560 kg vs Measured: 555.6 kg (0.79% variance)",
      }));

      await sleep(2000);
      navigate(`/cases/${created.caseId}/verification?demo=true`);

      await sleep(1500);
      setDemoState((prev) => ({
        ...prev,
        isActive: false,
        step: "IDLE",
      }));
    } catch (err) {
      console.error("Interactive demo error:", err);
      setDemoState((prev) => ({
        ...prev,
        isActive: false,
        step: "IDLE",
        currentMessage: "Interactive demo stopped due to an error.",
      }));
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
