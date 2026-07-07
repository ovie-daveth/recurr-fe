import { api } from "./client";
import type { Pagination } from "./businesses";
import type { DashboardResourceContext } from "./customers";

export type PlanStatus = "ACTIVE" | "PAUSED" | "ARCHIVED";
export type PlanInterval = "DAY" | "WEEK" | "MONTH" | "YEAR" | "CUSTOM";

export type Plan = {
  id: string;
  businessId: string;
  mode: "TEST" | "LIVE";
  name: string;
  code: string;
  amountMinor: number;
  currency: string;
  interval: PlanInterval;
  intervalCount: number;
  trialDays: number;
  status: PlanStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type ListPlansParams = {
  limit?: number;
  cursor?: string;
  status?: PlanStatus;
  createdFrom?: string;
  createdTo?: string;
};

export type PlanPayload = {
  name: string;
  code: string;
  amountMinor: number;
  currency: string;
  interval: PlanInterval;
  intervalCount: number;
  trialDays: number;
  metadata?: Record<string, unknown>;
};

export async function listPlans(context: DashboardResourceContext, params: ListPlansParams = {}) {
  const response = await api.get<{
    data: { plans: Plan[]; pagination: Pagination };
  }>("/plans", {
    params: {
      businessId: context.businessId,
      mode: context.mode,
      limit: 20,
      ...params
    }
  });
  return response.data.data;
}

export async function createPlan(context: DashboardResourceContext, payload: PlanPayload) {
  const response = await api.post<{ data: { plan: Plan } }>("/plans", {
    ...payload,
    businessId: context.businessId,
    mode: context.mode
  });
  return response.data.data.plan;
}

export async function updatePlan(context: DashboardResourceContext, planId: string, payload: Partial<PlanPayload> & { status?: PlanStatus }) {
  const response = await api.patch<{ data: { plan: Plan } }>(`/plans/${planId}`, payload, {
    params: {
      businessId: context.businessId,
      mode: context.mode
    }
  });
  return response.data.data.plan;
}

export async function archivePlan(context: DashboardResourceContext, planId: string) {
  const response = await api.delete<{ data: { plan: Plan } }>(`/plans/${planId}`, {
    params: {
      businessId: context.businessId,
      mode: context.mode
    }
  });
  return response.data.data.plan;
}
