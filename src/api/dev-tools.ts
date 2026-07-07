import { api } from "./client";

export type SimulateNombaWebhookPayload = {
  merchantTxRef?: string;
  orderReference?: string;
  amountMinor: number;
  currency: string;
  eventType: "payment_success" | "payment_failed";
  mode: "TEST" | "LIVE";
  cardId?: string;
  nombaCustomerId?: string;
  cardBrand?: string;
  cardLast4?: string;
  customerEmail?: string;
  skipTransactionVerification: boolean;
};

export type SimulateNombaWebhookResult = {
  event: {
    id: string;
    eventType: string;
    status: string;
    failureReason: string | null;
    providerEventId: string;
    processedAt: string | null;
  } | null;
  signedRequest: {
    url: string;
    headers: Record<string, string>;
    body: Record<string, unknown>;
  };
};

export async function simulateNombaWebhook(payload: SimulateNombaWebhookPayload) {
  const response = await api.post<{ data: SimulateNombaWebhookResult }>("/dev/webhooks/nomba/simulate", payload);
  return response.data.data;
}

export type FastForwardSubscriptionBillingPayload = {
  businessId: string;
  mode: "TEST" | "LIVE";
  minutesAgo: number;
};

export type FastForwardSubscriptionBillingResult = {
  subscription: {
    id: string;
    status: string;
    nextBillingAt: string | null;
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  workerHint: string;
};

export async function fastForwardSubscriptionBilling(
  subscriptionId: string,
  payload: FastForwardSubscriptionBillingPayload
) {
  const response = await api.post<{ data: FastForwardSubscriptionBillingResult }>(
    `/dev/billing/subscriptions/${subscriptionId}/fast-forward`,
    payload
  );
  return response.data.data;
}
