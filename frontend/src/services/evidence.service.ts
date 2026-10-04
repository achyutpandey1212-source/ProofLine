import { ApiClient } from "./api";
import { EvidenceItem, EvidenceType } from "../types";

export class EvidenceService {
  public static async listEvidence(caseId: string): Promise<EvidenceItem[]> {
    return ApiClient.get<EvidenceItem[]>(`/cases/${caseId}/evidence`);
  }

  public static async uploadEvidence(
    caseId: string,
    file: File,
    evidenceType: EvidenceType
  ): Promise<EvidenceItem> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", evidenceType);

    return ApiClient.post<EvidenceItem>(`/cases/${caseId}/evidence`, formData);
  }
}
