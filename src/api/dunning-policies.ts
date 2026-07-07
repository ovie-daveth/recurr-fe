import { api } from "./client";
import type { Pagination } from "./businesses";
import type { DashboardResourceContext } from "./customers";

export type DunningPolicyStatus = "ACTIVE" | "DISABLED";
export type DunningFinalAction = "CANCEL_SUBSCRIPTION" | "PAUSE_SUBSCRIPTION" | "MARK_INVOICE_UNCOLLECTIBLE";

export type DunningPolicyStep = {
  id: string;
  policyId: string;
  attemptNumber: number;
  delayMinutes: number;
  channel: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
};

export type DunningPolicy = {
  id: string;
  businessId: string;
  mode: "TEST" | "LIVE";
  name: string;
  status: DunningPolicyStatus;
  isDefault: boolean;
  finalAction: DunningFinalAction;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  steps: DunningPolicyStep[];
};

export type DunningPolicyPayload = {
  name: string;
  status: DunningPolicyStatus;
  isDefault: boolean;
  finalAction: DunningFinalAction;
  steps: Array<{
    delayMinutes: number;
    channel: string;
  }>;
};

export type ListDunningPoliciesParams = {
  limit?: number;
  cursor?: string;
  status?: DunningPolicyStatus;
  isDefault?: boolean;
  createdFrom?: string;
  createdTo?: string;
};

export async function listDunningPolicies(context: DashboardResourceContext, params: ListDunningPoliciesParams = {}) {
  const response = await api.get<{
    data: { dunningPolicies: DunningPolicy[]; pagination: Pagination };
  }>("/dunning-policies", {
    params: {
      businessId: context.businessId,
      mode: context.mode,
      limit: 20,
      ...params
    }
  });
  return response.data.data;
}

export async function createDunningPolicy(context: DashboardResourceContext, payload: DunningPolicyPayload) {
  const response = await api.post<{ data: { dunningPolicy: DunningPolicy } }>(
    "/dunning-policies",
    { ...payload, businessId: context.businessId, mode: context.mode },
    {
      headers: {
        "Idempotency-Key": `dash_dunning_policy_create_${crypto.randomUUID()}`
      }
    }
  );
  return response.data.data.dunningPolicy;
}

export async function updateDunningPolicy(context: DashboardResourceContext, policyId: string, payload: Partial<DunningPolicyPayload>) {
  const response = await api.patch<{ data: { dunningPolicy: DunningPolicy } }>(
    `/dunning-policies/${policyId}`,
    payload,
    {
      params: {
        businessId: context.businessId,
        mode: context.mode
      }
    }
  );
  return response.data.data.dunningPolicy;
}
