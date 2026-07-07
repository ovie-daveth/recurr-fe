import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  accessTokenExpiresAt: number | null;
  selectedBusinessId: string | null;
  selectedMode: "TEST" | "LIVE";
  setSession: (input: { accessToken: string; refreshToken: string; expiresIn?: number }) => void;
  setBusiness: (businessId: string | null) => void;
  setMode: (mode: "TEST" | "LIVE") => void;
  logout: () => void;
};

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      accessTokenExpiresAt: null,
      selectedBusinessId: null,
      selectedMode: "TEST",
      setSession: ({ accessToken, refreshToken, expiresIn }) =>
        set({
          accessToken,
          refreshToken,
          accessTokenExpiresAt: expiresIn ? Date.now() + expiresIn * 1000 : null
        }),
      setBusiness: (selectedBusinessId) => set({ selectedBusinessId }),
      setMode: (selectedMode) => set({ selectedMode }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          accessTokenExpiresAt: null,
          selectedBusinessId: null,
          selectedMode: "TEST"
        })
    }),
    { name: "recurr-dashboard-auth" }
  )
);
