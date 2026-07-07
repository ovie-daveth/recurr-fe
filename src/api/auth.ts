import { api } from "./client";

export type MerchantLoginPayload = {
  email: string;
  password: string;
};

export type MerchantSignupPayload = {
  email: string;
  password: string;
  contactPhone: string;
  country: string;
} & (
  | {
      type: "INDIVIDUAL";
      legalName: string;
      displayName?: string;
    }
  | {
      type: "BUSINESS";
      name: string;
      businessName: string;
      contactName: string;
      businessRegistrationNumber?: string;
      taxId?: string;
      website?: string;
    }
);

export type AuthResponse = {
  accessToken: string;
  token?: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export type SignupResponse = {
  emailVerificationSent: boolean;
  verificationUrl?: string;
  verificationToken?: string;
  warning?: string;
};

export async function loginMerchant(payload: MerchantLoginPayload) {
  const response = await api.post<{ data: AuthResponse }>("/merchants/login", payload);
  return response.data.data;
}

export async function signupMerchant(payload: MerchantSignupPayload) {
  const response = await api.post<{ data: SignupResponse }>("/merchants/signup", payload);
  return response.data.data;
}

export async function verifyMerchantEmail(email: string, token: string) {
  const response = await api.get<{ data: AuthResponse }>("/merchants/verify-email", {
    params: { email, token }
  });
  return response.data.data;
}

export async function refreshMerchantSession(refreshToken: string) {
  const response = await api.post<{ data: AuthResponse }>("/merchants/refresh", { refreshToken });
  return response.data.data;
}

export async function logoutMerchant(refreshToken?: string) {
  const response = await api.post("/merchants/logout", { refreshToken });
  return response.data;
}
