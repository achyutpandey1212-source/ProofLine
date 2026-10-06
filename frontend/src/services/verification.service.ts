import { ApiClient } from "./api";
import { VerificationReport, WorkflowProgress } from "../types";

export class VerificationClientService {
  /**
   * Triggers the complete verification workflow for a case.
   */
  public static async startVerification(caseId: string): Promise<void> {
    await ApiClient.post(`/cases/${caseId}/verify?async=1`);
  }

  /**
   * Polls the live verification progress.
   */
  public static async getStatus(caseId: string): Promise<WorkflowProgress> {
    return ApiClient.get<WorkflowProgress>(`/cases/${caseId}/verification/status`);
  }

  /**
   * Retrieves final verification report and findings.
   */
  public static async getReport(caseId: string): Promise<VerificationReport> {
    return ApiClient.get<VerificationReport>(`/cases/${caseId}/verification`);
  }

  /**
   * Runs an isolated adversarial simulation without affecting real case data.
   */
  public static async runSimulation(
    caseId: string,
    scenario: import("../types").SimulationScenario
  ): Promise<import("../types").SimulationResultDto> {
    return ApiClient.post<import("../types").SimulationResultDto>(
      `/cases/${caseId}/simulate`,
      { scenario }
    );
  }

  /**
   * Downloads the compiled Proof Packet PDF as a Blob.
   */
  public static async downloadProofPacketPdf(caseId: string): Promise<Blob> {
    return ApiClient.getBlob(`/cases/${caseId}/proof-packet/pdf`);
  }

  /**
   * Fetches structured Proof Packet metadata.
   */
  public static async getProofPacketMetadata(caseId: string): Promise<Record<string, unknown>> {
    return ApiClient.post<Record<string, unknown>>(`/cases/${caseId}/proof-packet`);
  }
}


