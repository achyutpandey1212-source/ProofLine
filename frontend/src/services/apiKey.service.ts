import { ApiClient } from "./api";

export interface ApiKeyDto {
  id: string;
  name: string;
  keyPrefix: string;
  isRevoked: boolean;
  lastUsedAt?: string;
  createdAt: string;
}

export interface CreatedApiKeyDto {
  id: string;
  apiKey: string; // Plaintext raw key (only returned once)
  keyPrefix: string;
  name: string;
  createdAt: string;
}

export class ApiKeyService {
  /**
   * Fetches user's active/revoked API keys.
   */
  public static async listKeys(): Promise<ApiKeyDto[]> {
    const res = await ApiClient.get<{ success: boolean; data: ApiKeyDto[] }>("/api-keys");
    return res.data;
  }

  /**
   * Generates a new API key.
   */
  public static async createKey(name: string): Promise<CreatedApiKeyDto> {
    const res = await ApiClient.post<{ success: boolean; data: CreatedApiKeyDto }>("/api-keys", {
      name,
    });
    return res.data;
  }

  /**
   * Revokes an existing API key.
   */
  public static async revokeKey(keyId: string): Promise<void> {
    await ApiClient.delete<{ success: boolean; message: string }>(`/api-keys/${keyId}`);
  }
}
