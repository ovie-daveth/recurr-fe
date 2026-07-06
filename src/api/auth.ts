import { api } from "./client";

export type MerchantLoginPayload = {
  email: string;
  password: string;
};

export type MerchantSignupPayload = {
  type: "INDIVIDUAL" | "BUSINESS";
  email: string;
  password: string;
  legalName: string;
  displayName: string;
  contactPhone: string;
  country: string;
};

export type AuthResponse = {
  accessToken: string;
  token?: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
};

export async function loginMerchant(payload: MerchantLoginPayload) {
  const response = await api.post<{ data: AuthResponse }>("/merchants/login", payload);
  return response.data.data;
}

export async function signupMerchant(payload: MerchantSignupPayload) {
  const response = await api.post("/merchants/signup", payload);
  return response.data;
}

export async function verifyMerchantEmail(email: string, token: string) {
  const response = await api.get<{ data: AuthResponse }>("/merchants/verify-email", {
    params: { email, token }
  });
  return response.data.data;
}
