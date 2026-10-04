export interface VerificationCreateRequest {
  transactionId: string;
  partnerName: string;
  material: string;
  claimedQuantity: number;
  unit: string;
  organization?: string;
  notes?: string;
}

export interface VerificationCreateResponse {
  id: string;
  transactionId: string;
  partnerName: string;
  material: string;
  claimedQuantity: number;
  unit: string;
  status: string;
  createdAt: string;
}

export interface EvidenceUploadResponse {
  id: string;
  type: string;
  filename: string;
  status: string;
}

export interface VerificationRunResponse {
  verificationId: string;
  status: string;
}

export interface VerificationResultResponse {
  id: string;
  status: string;
  result?: {
    decision: "VERIFIED" | "REVIEW_REQUIRED";
    risk: "LOW" | "REVIEW_REQUIRED" | "HIGH";
    claimedQuantity: number;
    measuredQuantity: number;
    difference: number;
    variancePercent: number;
  };
  findings?: Array<{
    code: string;
    severity: string;
    title: string;
    message: string;
    evidenceIds: string[];
  }>;
  createdAt?: string;
  completedAt?: string;
}

export interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    requestId: string;
  };
}

export interface RequestHistoryItem {
  id: string;
  method: string;
  endpoint: string;
  status: number;
  statusText: string;
  durationMs: number;
  timestamp: string;
  response: unknown;
  isError: boolean;
}

const getBaseUrl = () => {
  return import.meta.env.VITE_API_URL || "";
};

export class PlaygroundService {
  /**
   * POST /api/v1/verifications
   */
  public static async createVerification(
    apiKey: string,
    body: VerificationCreateRequest,
    idempotencyKey?: string
  ): Promise<{ status: number; data: unknown; durationMs: number; requestId: string }> {
    const start = performance.now();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey.trim()}`,
    };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const res = await fetch(`${getBaseUrl()}/api/v1/verifications`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const durationMs = Math.round(performance.now() - start);
    const data = await res.json().catch(() => ({}));
    const requestId = res.headers.get("X-Request-ID") || "";

    return { status: res.status, data, durationMs, requestId };
  }

  /**
   * POST /api/v1/verifications/:verificationId/evidence
   */
  public static async uploadEvidence(
    apiKey: string,
    verificationId: string,
    file: File | Blob,
    filename: string,
    evidenceType: string
  ): Promise<{ status: number; data: unknown; durationMs: number; requestId: string }> {
    const start = performance.now();
    const formData = new FormData();
    formData.append("file", file, filename);
    formData.append("evidenceType", evidenceType);

    const res = await fetch(`${getBaseUrl()}/api/v1/verifications/${verificationId}/evidence`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: formData,
    });

    const durationMs = Math.round(performance.now() - start);
    const data = await res.json().catch(() => ({}));
    const requestId = res.headers.get("X-Request-ID") || "";

    return { status: res.status, data, durationMs, requestId };
  }

  /**
   * POST /api/v1/verifications/:verificationId/run
   */
  public static async runVerification(
    apiKey: string,
    verificationId: string,
    idempotencyKey?: string
  ): Promise<{ status: number; data: unknown; durationMs: number; requestId: string }> {
    const start = performance.now();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${apiKey.trim()}`,
    };
    if (idempotencyKey) {
      headers["Idempotency-Key"] = idempotencyKey;
    }

    const res = await fetch(`${getBaseUrl()}/api/v1/verifications/${verificationId}/run`, {
      method: "POST",
      headers,
    });

    const durationMs = Math.round(performance.now() - start);
    const data = await res.json().catch(() => ({}));
    const requestId = res.headers.get("X-Request-ID") || "";

    return { status: res.status, data, durationMs, requestId };
  }

  /**
   * GET /api/v1/verifications/:verificationId
   */
  public static async getVerificationStatus(
    apiKey: string,
    verificationId: string
  ): Promise<{ status: number; data: unknown; durationMs: number; requestId: string }> {
    const start = performance.now();
    const res = await fetch(`${getBaseUrl()}/api/v1/verifications/${verificationId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    const durationMs = Math.round(performance.now() - start);
    const data = await res.json().catch(() => ({}));
    const requestId = res.headers.get("X-Request-ID") || "";

    return { status: res.status, data, durationMs, requestId };
  }

  /**
   * GET /api/v1/verifications/:verificationId/proof-packet
   * Downloads official PDF blob
   */
  public static async downloadProofPacket(
    apiKey: string,
    verificationId: string
  ): Promise<{ blob: Blob; status: number }> {
    const res = await fetch(`${getBaseUrl()}/api/v1/verifications/${verificationId}/proof-packet`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw errJson;
    }

    const blob = await res.blob();
    return { blob, status: res.status };
  }
}
