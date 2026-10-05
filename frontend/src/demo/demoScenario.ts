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
 * Official Proofline Demo Scenario
 * Transaction EW-104 with 560.00 kg claimed Washed PET Flakes and 3 weighbridge tickets:
 * 184.60 kg + 184.50 kg + 186.50 kg = 555.60 kg measured total (0.79% variance, LOW risk)
 */
export const OFFICIAL_DEMO_SCENARIO: DemoScenarioDefinition = {
  scenarioId: "EW-104-PET",
  title: "Commercial PET Scrap Reconciliation (EW-104)",
  description:
    "Reconciliation of claimed 560.00 kg Washed PET Flakes against three independent weighbridge slips yielding 555.60 kg with 0.79% variance.",
  caseData: {
    transactionId: "EW-104",
    partnerName: "NexCycle Polymers Private Limited",
    material: "Washed PET Flakes — Clear Grade",
    claimedQuantity: 560,
    unit: "kg",
    organization: "Ardent Packaging Industries Private Limited",
    notes: "Consignment Ref: PO/ARI/2026-107 | Invoice: NXP/26-27/0184 | Vehicle: MH 04 KT 7821 | Batch: NXP-PET-261004-B17 | Origin: Bhiwandi, Maharashtra",
  },
  evidence: [
    {
      id: "demo-ev-inv",
      type: "INVOICE",
      fileName: "Commercial Invoice on Wooden Desk.png",
      assetPath: "/demo/Commercial Invoice on Wooden Desk.png",
      description: "Commercial Tax Invoice NXP/26-27/0184 for 560.00 kg Washed PET Flakes",
      expectedWeight: 560,
      expectedUnit: "kg",
    },
    {
      id: "demo-ev-sc1",
      type: "SCALE_IMAGE",
      fileName: "Industrial Weighbridge Ticket on Metal Surface.png",
      assetPath: "/demo/Industrial Weighbridge Ticket on Metal Surface.png",
      description: "Weighbridge Ticket WB-261004-184 showing 184.60 kg net weight",
      expectedWeight: 184.60,
      expectedUnit: "kg",
    },
    {
      id: "demo-ev-sc2",
      type: "SCALE_IMAGE",
      fileName: "Industrial Weighbridge Receipt on Steel.png",
      assetPath: "/demo/Industrial Weighbridge Receipt on Steel.png",
      description: "Weighbridge Receipt WB-261004-185 showing 184.50 kg net weight",
      expectedWeight: 184.50,
      expectedUnit: "kg",
    },
    {
      id: "demo-ev-sc3",
      type: "SCALE_IMAGE",
      fileName: "Industrial Weighbridge Ticket on Desk.png",
      assetPath: "/demo/Industrial Weighbridge Ticket on Desk.png",
      description: "Weighbridge Ticket WB-261004-186 showing 186.50 kg net weight",
      expectedWeight: 186.50,
      expectedUnit: "kg",
    },
    {
      id: "demo-ev-cert",
      type: "CERTIFICATE",
      fileName: "Certificate of Analysis on Dark Desk.png",
      assetPath: "/demo/Certificate of Analysis on Dark Desk.png",
      description: "Certificate of Analysis Batch NXP-PET-261004-B17 (Quality & Purity 99.2%)",
      expectedWeight: 560,
      expectedUnit: "kg",
    },
  ],
  expectedOutcome: {
    claimedQuantity: 560,
    scaleReadings: [184.60, 184.50, 186.50],
    measuredTotal: 555.60,
    difference: 4.40,
    variancePercentage: 0.79,
    expectedRisk: "LOW",
    status: "VERIFICATION_COMPLETE",
  },
};
