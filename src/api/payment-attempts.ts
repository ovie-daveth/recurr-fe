import { api } from "./client";
import type { Pagination } from "./businesses";
import type { Customer, DashboardResourceContext } from "./customers";
import type { Invoice } from "./invoices";
import type { Subscription } from "./subscriptions";

export type PaymentAttemptStatus = "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "REQUIRES_ACTION" | "ABANDONED";

export type PaymentAttempt = {
  id: string;
  businessId: string;
  subscriptionId: string;
  invoiceId: string;
  customerId: string;
  paymentMethodId: string;
  mode: "TEST" | "LIVE";
  provider: string;
  amountMinor: number;
  currency: string;
  status: PaymentAttemptStatus;
  providerReference: string | null;
  failureReason: string | null;
  attemptNumber: number;
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  invoice?: Invoice;
  subscription?: Subscription;
  paymentMethod?: {
    id: string;
    type: string;
    brand: string | null;
    last4: string | null;
    status: string;
    reusable: boolean;
  };
};

export type ListPaymentAttemptsParams = {
  limit?: number;
  cursor?: string;
  status?: PaymentAttemptStatus;
  invoiceId?: string;
  subscriptionId?: string;
  customerId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export async function listPaymentAttempts(context: DashboardResourceContext, params: ListPaymentAttemptsParams = {}) {
  const response = await api.get<{
    data: { paymentAttempts: PaymentAttempt[]; pagination: Pagination };
  }>("/payment-attempts", {
    params: {
      businessId: context.businessId,
      mode: context.mode,
      limit: 20,
      ...params
    }
  });
  return response.data.data;
}

export async function getPaymentAttempt(context: DashboardResourceContext, attemptId: string) {
  const response = await api.get<{ data: { paymentAttempt: PaymentAttempt } }>(`/payment-attempts/${attemptId}`, {
    params: {
      businessId: context.businessId,
      mode: context.mode
    }
  });
  return response.data.data.paymentAttempt;
}
