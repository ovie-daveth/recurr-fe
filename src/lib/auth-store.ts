import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  selectedBusinessId: string | null;
  selectedMode: "TEST" | "LIVE";
  setSession: (input: { accessToken: string; refreshToken: string }) => void;
  setBusiness: (businessId: string | null) => void;
  setMode: (mode: "TEST" | "LIVE") => void;
  logout: () => void;
};

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      selectedBusinessId: null,
      selectedMode: "TEST",
      setSession: ({ accessToken, refreshToken }) => set({ accessToken, refreshToken }),
      setBusiness: (selectedBusinessId) => set({ selectedBusinessId }),
      setMode: (selectedMode) => set({ selectedMode }),
      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          selectedBusinessId: null,
          selectedMode: "TEST"
        })
    }),
    { name: "recurr-dashboard-auth" }
  )
);
