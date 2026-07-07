import { api } from "./client";
import type { Pagination } from "./businesses";

export type MerchantWebhookEvent =
  | "*"
  | "customer.created"
  | "plan.created"
  | "subscription.created"
  | "subscription.trialing"
  | "subscription.active"
  | "subscription.past_due"
  | "subscription.cancelled"
  | "invoice.created"
  | "invoice.payment_succeeded"
  | "invoice.payment_failed"
  | "payment_method.updated"
  | "dunning.retry_scheduled"
  | "dunning.exhausted";

export const merchantWebhookEvents: MerchantWebhookEvent[] = [
  "*",
  "customer.created",
  "plan.created",
  "subscription.created",
  "subscription.trialing",
  "subscription.active",
  "subscription.past_due",
  "subscription.cancelled",
  "invoice.created",
  "invoice.payment_succeeded",
  "invoice.payment_failed",
  "payment_method.updated",
  "dunning.retry_scheduled",
  "dunning.exhausted"
];

export type WebhookEndpoint = {
  id: string;
  businessId: string;
  url: string;
  description: string | null;
  events: MerchantWebhookEvent[];
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
};

export type WebhookDelivery = {
  id: string;
  businessId: string;
  endpointId: string;
  eventType: string;
  status: "PENDING" | "DELIVERED" | "FAILED" | "RETRYING";
  attemptNumber: number;
  nextAttemptAt: string | null;
  deliveredAt: string | null;
  lastError: string | null;
  responseStatusCode: number | null;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEvent = {
  id: string;
  provider: string;
  mode: "TEST" | "LIVE";
  providerEventId: string;
  eventType: string;
  status: "RECEIVED" | "PROCESSED" | "FAILED";
  payload: Record<string, unknown>;
  failureReason: string | null;
  receivedAt: string;
  processedAt: string | null;
};

export type CreateWebhookEndpointPayload = {
  url: string;
  description?: string;
  events: MerchantWebhookEvent[];
};

export async function listWebhookEndpoints(businessId: string, params: { limit?: number; status?: WebhookEndpoint["status"] } = {}) {
  const response = await api.get<{
    data: { webhookEndpoints: WebhookEndpoint[]; pagination: Pagination };
  }>(`/businesses/${businessId}/webhook-endpoints`, {
    params: { limit: 20, ...params }
  });
  return response.data.data;
}

export async function createWebhookEndpoint(businessId: string, payload: CreateWebhookEndpointPayload) {
  const response = await api.post<{
    data: { webhookEndpoint: WebhookEndpoint; signingSecret: string; warning: string };
  }>(`/businesses/${businessId}/webhook-endpoints`, payload);
  return response.data.data;
}

export async function disableWebhookEndpoint(businessId: string, endpointId: string) {
  const response = await api.delete<{ data: { webhookEndpoint: WebhookEndpoint } }>(
    `/businesses/${businessId}/webhook-endpoints/${endpointId}`
  );
  return response.data.data.webhookEndpoint;
}

export async function testWebhookEndpoint(businessId: string, endpointId: string) {
  const response = await api.post<{ data: { webhookDelivery: WebhookDelivery } }>(
    `/businesses/${businessId}/webhook-endpoints/${endpointId}/test`
  );
  return response.data.data.webhookDelivery;
}

export async function listWebhookDeliveries(
  businessId: string,
  endpointId: string,
  params: { limit?: number; status?: WebhookDelivery["status"]; eventType?: string } = {}
) {
  const response = await api.get<{
    data: { webhookDeliveries: WebhookDelivery[]; pagination: Pagination };
  }>(`/businesses/${businessId}/webhook-endpoints/${endpointId}/deliveries`, {
    params: { limit: 20, ...params }
  });
  return response.data.data;
}

export async function listProviderWebhookEvents(params: {
  provider?: string;
  mode?: "TEST" | "LIVE";
  status?: WebhookEvent["status"];
  eventType?: string;
  limit?: number;
}) {
  const response = await api.get<{
    data: { webhookEvents: WebhookEvent[]; pagination: Pagination };
  }>("/webhooks/events", {
    params: { provider: "nomba", limit: 20, ...params }
  });
  return response.data.data;
}
