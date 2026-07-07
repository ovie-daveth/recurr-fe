import { api } from "./client";
import type { Pagination } from "./businesses";

export type CustomerStatus = "ACTIVE" | "DISABLED";

export type Customer = {
  id: string;
  businessId: string;
  mode: "TEST" | "LIVE";
  email: string;
  name: string | null;
  phone: string | null;
  externalReference: string | null;
  status: CustomerStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export type DashboardResourceContext = {
  businessId: string;
  mode: "TEST" | "LIVE";
};

export type ListCustomersParams = {
  limit?: number;
  cursor?: string;
  status?: CustomerStatus;
  createdFrom?: string;
  createdTo?: string;
};

export type CustomerPayload = {
  email: string;
  name?: string;
  phone?: string;
  externalReference?: string;
  metadata?: Record<string, unknown>;
};

export async function listCustomers(context: DashboardResourceContext, params: ListCustomersParams = {}) {
  const response = await api.get<{
    data: { customers: Customer[]; pagination: Pagination };
  }>("/customers", {
    params: {
      businessId: context.businessId,
      mode: context.mode,
      limit: 20,
      ...params
    }
  });
  return response.data.data;
}

export async function createCustomer(context: DashboardResourceContext, payload: CustomerPayload) {
  const response = await api.post<{ data: { customer: Customer } }>("/customers", {
    ...payload,
    businessId: context.businessId,
    mode: context.mode
  });
  return response.data.data.customer;
}

export async function updateCustomer(context: DashboardResourceContext, customerId: string, payload: Partial<CustomerPayload>) {
  const response = await api.patch<{ data: { customer: Customer } }>(`/customers/${customerId}`, payload, {
    params: {
      businessId: context.businessId,
      mode: context.mode
    }
  });
  return response.data.data.customer;
}

export async function updateCustomerStatus(context: DashboardResourceContext, customerId: string, status: CustomerStatus) {
  const response = await api.post<{ data: { customer: Customer } }>(
    `/customers/${customerId}/status`,
    { status },
    {
      params: {
        businessId: context.businessId,
        mode: context.mode
      }
    }
  );
  return response.data.data.customer;
}
