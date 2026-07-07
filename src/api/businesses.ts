import { api } from "./client";

export type BusinessType = "BUSINESS" | "INDIVIDUAL";
export type BusinessStatus = "PENDING_VERIFICATION" | "ACTIVE" | "SUSPENDED";

export type Business = {
  id: string;
  ownerUserId: string;
  type: BusinessType;
  slug: string;
  name: string;
  status: BusinessStatus;
  businessName: string | null;
  businessRegistrationNumber: string | null;
  taxId: string | null;
  website: string | null;
  legalName: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
  createdAt: string;
  updatedAt: string;
};

export type Pagination = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
};

export type ListBusinessesParams = {
  limit?: number;
  cursor?: string;
  status?: BusinessStatus;
  createdFrom?: string;
  createdTo?: string;
};

export type CreateBusinessPayload = {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  country: string;
} & (
  | {
      type: "BUSINESS";
      businessName: string;
      businessRegistrationNumber?: string;
      taxId?: string;
      website?: string;
    }
  | {
      type: "INDIVIDUAL";
      legalName: string;
    }
);

export type UpdateBusinessPayload = Partial<CreateBusinessPayload>;

export async function listBusinesses(params: ListBusinessesParams = {}) {
  const response = await api.get<{
    data: { businesses: Business[]; pagination: Pagination };
  }>("/businesses", { params: { limit: 20, ...params } });
  return response.data.data;
}

export async function getBusiness(businessId: string) {
  const response = await api.get<{ data: { business: Business } }>(`/businesses/${businessId}`);
  return response.data.data.business;
}

export async function createBusiness(payload: CreateBusinessPayload) {
  const response = await api.post<{ data: { business: Business } }>("/businesses", payload);
  return response.data.data.business;
}

export async function updateBusiness(businessId: string, payload: UpdateBusinessPayload) {
  const response = await api.patch<{ data: { business: Business } }>(`/businesses/${businessId}`, payload);
  return response.data.data.business;
}
