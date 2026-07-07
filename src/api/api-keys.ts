import { api } from "./client";
import type { Pagination } from "./businesses";

export type ApiKeyMode = "TEST" | "LIVE";
export type ApiKeyStatus = "ACTIVE" | "REVOKED" | "EXPIRED";

export type ApiKey = {
  id: string;
  name: string;
  mode: ApiKeyMode;
  prefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export type ListApiKeysParams = {
  limit?: number;
  cursor?: string;
  mode?: ApiKeyMode;
  status?: ApiKeyStatus;
  createdFrom?: string;
  createdTo?: string;
};

export type CreateApiKeyPayload = {
  name: string;
  mode: ApiKeyMode;
  expiresAt?: string;
};

export type CreateApiKeyResult = {
  apiKey: ApiKey;
  secret: string;
  warning: string;
};

export async function listApiKeys(businessId: string, params: ListApiKeysParams = {}) {
  const response = await api.get<{
    data: { apiKeys: ApiKey[]; pagination: Pagination };
  }>(`/businesses/${businessId}/api-keys`, { params: { limit: 20, ...params } });
  return response.data.data;
}

export async function createApiKey(businessId: string, payload: CreateApiKeyPayload) {
  const response = await api.post<{ data: CreateApiKeyResult }>(`/businesses/${businessId}/api-keys`, payload);
  return response.data.data;
}

export async function revokeApiKey(businessId: string, apiKeyId: string) {
  const response = await api.post<{ data: { apiKey: ApiKey } }>(
    `/businesses/${businessId}/api-keys/${apiKeyId}/revoke`
  );
  return response.data.data.apiKey;
}
