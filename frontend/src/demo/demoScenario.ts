import { EvidenceType } from "../types";

export interface DemoEvidenceItem {
  id: string;
  type: EvidenceType;
  fileName: string;
  assetPath: string;
  description: string;
  expectedWeight?: number;
  expectedUnit?: string;
}

export interface DemoScenarioDefinition {
  scenarioId: string;
  title: string;
  description: string;
  caseData: {
    transactionId: string;
    partnerName: string;
    material: string;
    claimedQuantity: number;
    unit: string;
    organization: string;
    notes: string;
  };
  evidence: DemoEvidenceItem[];
  expectedOutcome: {
    claimedQuantity: number;
    scaleReadings: number[];
    measuredTotal: number;
    difference: number;
    variancePercentage: number;
    expectedRisk: "LOW" | "HIGH" | "REVIEW_REQUIRED";
    status: "VERIFICATION_COMPLETE";
  };
}

/**
 * Official Proofline Hackathon Demo Scenario (from Docs/DEMO_SCENARIO.md)
 * Transaction EW-104 with 560 kg claimed PET Plastic Flakes and 3 scale receipts:
 * 184.6 kg + 193.2 kg + 177.8 kg = 555.6 kg measured total (0.79% variance, LOW risk)
 */
export const OFFICIAL_DEMO_SCENARIO: DemoScenarioDefinition = {
  scenarioId: "EW-104-PET",
  title: "Official Demo: Commercial PET Scrap Reconciliation (EW-104)",
  description:
    "Reconciliation of claimed 560 kg PET Flakes against three independent weighbridge slips yielding 555.6 kg with 0.79% variance.",
  caseData: {
    transactionId: "EW-104",
    partnerName: "ABC Recycling Pvt Ltd",
    material: "PET Plastic Flakes",
    claimedQuantity: 560,
    unit: "kg",
    organization: "Apex Polymer Solutions Ltd",
    notes: "Official Hackathon Demo: Invoiced 560 kg compared deterministically against 3 weighbridge scale slips.",
  },
  evidence: [
    {
      id: "demo-ev-inv",
      type: "INVOICE",
      fileName: "invoice-ew104.jpg",
      assetPath: "/demo/invoice-ew104.jpg",
      description: "Commercial Tax Invoice INV-2026-EW104 for 560 kg PET Plastic Flakes",
      expectedWeight: 560,
      expectedUnit: "kg",
    },
    {
      id: "demo-ev-sc1",
      type: "SCALE_IMAGE",
      fileName: "scale-ticket-01.jpg",
      assetPath: "/demo/scale-ticket-01.jpg",
      description: "Weighbridge Scale Slip WT-104-01 showing 184.6 kg net weight",
      expectedWeight: 184.6,
      expectedUnit: "kg",
    },
    {
      id: "demo-ev-sc2",
      type: "SCALE_IMAGE",
      fileName: "scale-ticket-02.jpg",
      assetPath: "/demo/scale-ticket-02.jpg",
      description: "Weighbridge Scale Slip WT-104-02 showing 193.2 kg net weight",
      expectedWeight: 193.2,
      expectedUnit: "kg",
    },
    {
      id: "demo-ev-sc3",
      type: "SCALE_IMAGE",
      fileName: "scale-ticket-03.jpg",
      assetPath: "/demo/scale-ticket-03.jpg",
      description: "Weighbridge Scale Slip WT-104-03 showing 177.8 kg net weight",
      expectedWeight: 177.8,
      expectedUnit: "kg",
    },
  ],
  expectedOutcome: {
    claimedQuantity: 560,
    scaleReadings: [184.6, 193.2, 177.8],
    measuredTotal: 555.6,
    difference: 4.4,
    variancePercentage: 0.79,
    expectedRisk: "LOW",
    status: "VERIFICATION_COMPLETE",
  },
};
