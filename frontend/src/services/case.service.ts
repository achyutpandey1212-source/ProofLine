import { ApiClient } from "./api";
import { CaseItem } from "../types";

export interface CreateCasePayload {
  transactionId: string;
  partnerName: string;
  material: string;
  claimedQuantity: number;
  unit: string;
  organization?: string;
  notes?: string;
}

export class CaseService {
  public static async listCases(): Promise<CaseItem[]> {
    return ApiClient.get<CaseItem[]>("/cases");
  }

  public static async getCase(caseId: string): Promise<CaseItem> {
    return ApiClient.get<CaseItem>(`/cases/${caseId}`);
  }

  public static async createCase(payload: CreateCasePayload): Promise<CaseItem> {
    return ApiClient.post<CaseItem>("/cases", payload);
  }

  public static async getProofGraph(caseId: string): Promise<import("../types").ProofGraphDto> {
    return ApiClient.get<import("../types").ProofGraphDto>(`/cases/${caseId}/proof-graph`);
  }
}
