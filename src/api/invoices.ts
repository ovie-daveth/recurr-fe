import { api } from "./client";
import type { Pagination } from "./businesses";
import type { Customer, DashboardResourceContext } from "./customers";
import type { Subscription } from "./subscriptions";

export type InvoiceStatus = "DRAFT" | "OPEN" | "PAYMENT_PROCESSING" | "PAID" | "PAYMENT_FAILED" | "VOID" | "UNCOLLECTIBLE";

export type PaymentAttempt = {
  id: string;
  providerReference: string | null;
  status: string;
  amountMinor: number;
  currency: string;
  attemptNumber: number;
  failureReason: string | null;
  requestedAt: string;
  processedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type InvoiceItem = {
  id: string;
  description: string;
  amountMinor: number;
  currency: string;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
};

export type Invoice = {
  id: string;
  businessId: string;
  subscriptionId: string;
  customerId: string;
  mode: "TEST" | "LIVE";
  status: InvoiceStatus;
  amountDueMinor: number;
  amountPaidMinor: number;
  currency: string;
  dueAt: string;
  paidAt: string | null;
  periodStart: string;
  periodEnd: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  subscription?: Subscription;
  items?: InvoiceItem[];
  attempts?: PaymentAttempt[];
  dunningAttempts?: unknown[];
};

export type ListInvoicesParams = {
  limit?: number;
  cursor?: string;
  status?: InvoiceStatus;
  subscriptionId?: string;
  customerId?: string;
  createdFrom?: string;
  createdTo?: string;
};

export async function listInvoices(context: DashboardResourceContext, params: ListInvoicesParams = {}) {
  const response = await api.get<{
    data: { invoices: Invoice[]; pagination: Pagination };
  }>("/invoices", {
    params: {
      businessId: context.businessId,
      mode: context.mode,
      limit: 20,
      ...params
    }
  });
  return response.data.data;
}

export async function getInvoice(context: DashboardResourceContext, invoiceId: string) {
  const response = await api.get<{ data: { invoice: Invoice } }>(`/invoices/${invoiceId}`, {
    params: {
      businessId: context.businessId,
      mode: context.mode
    }
  });
  return response.data.data.invoice;
}

export async function payInvoice(context: DashboardResourceContext, invoiceId: string) {
  const response = await api.post<{ data: { invoice: Invoice; paymentAttempt?: PaymentAttempt } }>(
    `/invoices/${invoiceId}/pay`,
    { businessId: context.businessId, mode: context.mode },
    {
      headers: {
        "Idempotency-Key": `dash_invoice_pay_${invoiceId}_${crypto.randomUUID()}`
      }
    }
  );
  return response.data.data;
}
