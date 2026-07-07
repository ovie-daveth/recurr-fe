import { api } from "./client";
import type { Plan } from "./plans";

export type PublicSubscribeBusiness = {
  id: string;
  slug: string;
  name: string;
  website: string | null;
  country: string;
};

export type PublicSubscriptionPage = {
  business: PublicSubscribeBusiness;
  plan: Plan;
};

export type StartPublicSubscriptionPayload = {
  mode: "TEST" | "LIVE";
  email: string;
  name?: string;
  phone?: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
};

export async function getPublicSubscriptionPage(businessSlug: string, planCode: string, mode: "TEST" | "LIVE") {
  const response = await api.get<{ data: PublicSubscriptionPage }>(`/public/subscribe/${businessSlug}/${planCode}`, {
    params: { mode }
  });
  return response.data.data;
}

export async function startPublicSubscription(businessSlug: string, planCode: string, payload: StartPublicSubscriptionPayload) {
  const response = await api.post<{
    data: {
      checkout: { provider: string; reference: string; checkoutUrl: string };
    };
  }>(`/public/subscribe/${businessSlug}/${planCode}/start`, payload);
  return response.data.data;
}
