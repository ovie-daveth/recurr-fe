import { api } from "./client";
import type { DashboardResourceContext } from "./customers";

export type PaymentMethodStatus = "PENDING_SETUP" | "ACTIVE" | "DISABLED" | "EXPIRED";

export type PaymentMethod = {
  id: string;
  businessId: string;
  customerId: string;
  mode: "TEST" | "LIVE";
  provider: string;
  type: string;
  status: PaymentMethodStatus;
  providerSetupReference: string | null;
  providerCustomerReference: string | null;
  providerPaymentMethodReference: string | null;
  brand: string | null;
  last4: string | null;
  expMonth: number | null;
  expYear: number | null;
  reusable: boolean;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export async function listPaymentMethods(
  context: DashboardResourceContext,
  customerId: string,
  params: { status?: PaymentMethodStatus } = {}
) {
  const response = await api.get<{ data: { paymentMethods: PaymentMethod[] } }>(`/customers/${customerId}/payment-methods`, {
    params: {
      businessId: context.businessId,
      mode: context.mode,
      ...params
    }
  });
  return response.data.data.paymentMethods;
}

export async function setupPaymentMethodCheckout(context: DashboardResourceContext, customerId: string) {
  const response = await api.post<{
    data: {
      paymentMethod: PaymentMethod;
      checkout: { provider: string; reference: string; checkoutUrl: string };
    };
  }>(
    `/customers/${customerId}/payment-methods/setup-checkout`,
    {
      businessId: context.businessId,
      mode: context.mode,
      metadata: { source: "merchant_dashboard" }
    },
    {
      headers: {
        "Idempotency-Key": `dash_pm_setup_${customerId}_${crypto.randomUUID()}`
      }
    }
  );
  return response.data.data;
}

export async function revokePaymentMethod(context: DashboardResourceContext, customerId: string, paymentMethodId: string) {
  const response = await api.delete<{ data: { paymentMethod: PaymentMethod } }>(
    `/customers/${customerId}/payment-methods/${paymentMethodId}`,
    {
      params: {
        businessId: context.businessId,
        mode: context.mode
      }
    }
  );
  return response.data.data.paymentMethod;
}
