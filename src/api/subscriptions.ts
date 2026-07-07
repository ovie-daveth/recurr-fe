import { api } from "./client";
import type { Customer, DashboardResourceContext } from "./customers";
import type { Pagination } from "./businesses";
import type { Plan } from "./plans";

export type SubscriptionStatus =
  | "INCOMPLETE"
  | "TRIALING"
  | "ACTIVE"
  | "PAST_DUE"
  | "PAUSED"
  | "CANCELLED"
  | "EXPIRED";

export type Subscription = {
  id: string;
  businessId: string;
  customerId: string;
  planId: string;
  paymentMethodId: string;
  mode: "TEST" | "LIVE";
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingAt: string | null;
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  pausedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  plan?: Plan;
  paymentMethod?: {
    id: string;
    type: string;
    brand: string | null;
    last4: string | null;
    status: string;
    reusable: boolean;
  };
};

export type ListSubscriptionsParams = {
  limit?: number;
  cursor?: string;
  status?: SubscriptionStatus;
  createdFrom?: string;
  createdTo?: string;
};

export type CreateSubscriptionPayload = {
  customerId: string;
  planId: string;
  paymentMethodId: string;
  trialDays?: number;
  metadata?: Record<string, unknown>;
};

export type ChangeSubscriptionPlanPayload = {
  newPlanId: string;
  effective: "IMMEDIATE" | "PERIOD_END";
  prorationBehavior: "CREATE_PRORATION" | "NONE";
  metadata?: Record<string, unknown>;
};

export async function listSubscriptions(context: DashboardResourceContext, params: ListSubscriptionsParams = {}) {
  const response = await api.get<{
    data: { subscriptions: Subscription[]; pagination: Pagination };
  }>("/subscriptions", {
    params: {
      businessId: context.businessId,
      mode: context.mode,
      limit: 20,
      ...params
    }
  });
  return response.data.data;
}

export async function createSubscription(context: DashboardResourceContext, payload: CreateSubscriptionPayload) {
  const response = await api.post<{ data: { subscription: Subscription } }>(
    "/subscriptions",
    {
      ...payload,
      businessId: context.businessId,
      mode: context.mode
    },
    {
      headers: {
        "Idempotency-Key": `dash_subscription_create_${crypto.randomUUID()}`
      }
    }
  );
  return response.data.data.subscription;
}

export async function pauseSubscription(context: DashboardResourceContext, subscriptionId: string) {
  const response = await api.post<{ data: { subscription: Subscription } }>(
    `/subscriptions/${subscriptionId}/pause`,
    { businessId: context.businessId, mode: context.mode }
  );
  return response.data.data.subscription;
}

export async function resumeSubscription(context: DashboardResourceContext, subscriptionId: string) {
  const response = await api.post<{ data: { subscription: Subscription } }>(
    `/subscriptions/${subscriptionId}/resume`,
    { businessId: context.businessId, mode: context.mode }
  );
  return response.data.data.subscription;
}

export async function cancelSubscription(context: DashboardResourceContext, subscriptionId: string, cancelAtPeriodEnd: boolean) {
  const response = await api.post<{ data: { subscription: Subscription } }>(
    `/subscriptions/${subscriptionId}/cancel`,
    { businessId: context.businessId, mode: context.mode, cancelAtPeriodEnd }
  );
  return response.data.data.subscription;
}

export async function changeSubscriptionPlan(
  context: DashboardResourceContext,
  subscriptionId: string,
  payload: ChangeSubscriptionPlanPayload
) {
  const response = await api.post<{ data: { subscription: Subscription } }>(
    `/subscriptions/${subscriptionId}/change-plan`,
    { ...payload, businessId: context.businessId, mode: context.mode }
  );
  return response.data.data.subscription;
}
