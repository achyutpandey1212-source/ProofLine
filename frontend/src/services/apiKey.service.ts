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
    if (Array.isArray(res)) return res;
    if (res && Array.isArray((res as any).data)) return (res as any).data;
    return [];
  }

  /**
   * Generates a new API key.
   */
  public static async createKey(name: string): Promise<CreatedApiKeyDto> {
    const res = await ApiClient.post<any>("/api-keys", {
      name,
    });
    // If ApiClient already unwrapped the response.data object:
    if (res && res.apiKey) {
      return res as CreatedApiKeyDto;
    }
    // If res still contains the envelope { success: true, data: {...} }:
    if (res && res.data && res.data.apiKey) {
      return res.data as CreatedApiKeyDto;
    }
    return res as CreatedApiKeyDto;
  }

  /**
   * Revokes an existing API key.
   */
  public static async revokeKey(keyId: string): Promise<void> {
    await ApiClient.delete<{ success: boolean; message: string }>(`/api-keys/${keyId}`);
  }

  /**
   * Permanently deletes an existing API key.
   */
  public static async deleteKey(keyId: string): Promise<void> {
    await ApiClient.delete<{ success: boolean; message: string }>(`/api-keys/${keyId}/permanent`);
  }
}
