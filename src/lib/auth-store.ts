import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  selectedBusinessId: string | null;
  selectedMode: "TEST" | "LIVE";
  businessApiKeySecrets: Record<string, string>;
  setSession: (input: { accessToken: string; refreshToken: string; expiresIn?: number }) => void;
  setBusiness: (businessId: string | null) => void;
  setMode: (mode: "TEST" | "LIVE") => void;
  setBusinessApiKeySecret: (input: { businessId: string; mode: "TEST" | "LIVE"; secret: string }) => void;
  clearBusinessApiKeySecret: (input: { businessId: string; mode: "TEST" | "LIVE" }) => void;
  logout: () => void;
};

export function businessApiKeySecretId(businessId: string, mode: "TEST" | "LIVE") {
  return `${businessId}:${mode}`;
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      selectedBusinessId: null,
      selectedMode: "TEST",
      businessApiKeySecrets: {},
      setSession: ({ accessToken, refreshToken, expiresIn }) =>
        set({
          accessToken,
          refreshToken,
          accessTokenExpiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null
        }),
      setBusiness: (selectedBusinessId) => set({ selectedBusinessId }),
      setMode: (selectedMode) => set({ selectedMode }),
      setBusinessApiKeySecret: ({ businessId, mode, secret }) =>
        set((state) => ({
          businessApiKeySecrets: {
            ...state.businessApiKeySecrets,
            [businessApiKeySecretId(businessId, mode)]: secret
          }
        })),
      clearBusinessApiKeySecret: ({ businessId, mode }) =>
        set((state) => {
          const next = { ...state.businessApiKeySecrets };
          delete next[businessApiKeySecretId(businessId, mode)];
          return { businessApiKeySecrets: next };
        }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          selectedBusinessId: null,
          selectedMode: "TEST",
          businessApiKeySecrets: {}
        })
    }),
    { name: "recurr-dashboard-auth" }
  )
);
