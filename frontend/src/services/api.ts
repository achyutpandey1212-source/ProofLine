import { auth } from "./firebase";

export interface ApiErrorResponse {
  success: boolean;
  code?: string;
  error?: string;
  details?: unknown;
}

export class ApiClient {
  private static baseUrl = import.meta.env.VITE_API_URL || "";

  /**
   * Retrieves current Firebase auth token for backend requests
   */
  private static async getAuthHeader(): Promise<Record<string, string>> {
    const user = auth.currentUser;
    if (!user) {
      return {};
    }
    const token = await user.getIdToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  /**
   * Translates backend error codes into customer-friendly wording
   */
  private static formatErrorMessage(status: number, data: ApiErrorResponse | null, fallback: string): string {
    if (status === 401) {
      return "Your session has expired. Please sign in again.";
    }
    if (status === 404) {
      return "Case or evidence not found.";
    }
    if (status === 409) {
      return "Verification or processing is already in progress for this item.";
    }
    if (status === 415) {
      return "Unsupported file type. Please upload a JPEG, PNG, WEBP, or PDF file.";
    }
    if (status === 502) {
      return "Unable to complete document review at this moment. Please retry.";
    }
    if (status >= 500) {
      return "A service error occurred. Please try again shortly.";
    }
    if (data?.error) {
      return data.error;
    }
    return fallback;
  }

  public static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = await this.getAuthHeader();
    const url = `${this.baseUrl}${endpoint}`;

    const headers: Record<string, string> = {
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    };

    if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const responseText = await response.text();
      let responseJson: ApiErrorResponse | null = null;
      try {
        responseJson = responseText ? JSON.parse(responseText) : null;
      } catch {
        // Response was not JSON
      }

      if (!response.ok) {
        const errorMsg = this.formatErrorMessage(
          response.status,
          responseJson,
          response.statusText || "Request failed"
        );
        throw new Error(errorMsg);
      }

      const parsedData = (responseJson as unknown as { data?: T })?.data;
      return (parsedData !== undefined ? parsedData : responseJson) as T;
    } catch (err) {
      if (err instanceof Error) {
        throw err;
      }
      throw new Error("Unable to reach Proofline. Check your connection and try again.");
    }
  }

  public static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  public static post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  public static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * Downloads binary file (e.g. PDF proof packet) with authentication header
   */
  public static async getBlob(endpoint: string): Promise<Blob> {
    const authHeaders = await this.getAuthHeader();
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        ...authHeaders,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText || response.status}`);
    }

    return response.blob();
  }
}

