import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import { authStore } from "../lib/auth-store";

const baseURL = `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"}${
  import.meta.env.VITE_API_VERSION ?? "/api/v1"
}`;

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json"
  }
});

let refreshPromise: Promise<string | null> | null = null;

function isAuthEndpoint(url?: string) {
  return Boolean(
    url?.includes("/merchants/login") ||
      url?.includes("/merchants/signup") ||
      url?.includes("/merchants/verify-email") ||
      url?.includes("/merchants/refresh")
  );
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = authStore.getState().refreshToken;
      if (!refreshToken) return null;

      try {
        const response = await axios.post<{ data: { accessToken?: string; token?: string; refreshToken: string; expiresIn?: number } }>(
          `${baseURL}/merchants/refresh`,
          { refreshToken },
          { headers: { "Content-Type": "application/json" } }
        );
        const session = response.data.data;
        const accessToken = session.accessToken ?? session.token;
        if (!accessToken) return null;

        authStore.getState().setSession({
          accessToken,
          refreshToken: session.refreshToken,
          expiresIn: session.expiresIn
        });
        return accessToken;
      } catch {
        authStore.getState().logout();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint(originalRequest.url)
    ) {
      originalRequest._retry = true;
      const accessToken = await refreshAccessToken();

      if (accessToken) {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      }
    }

    const message =
      (error.response?.data as { error?: { message?: string }; message?: string } | undefined)?.error?.message ??
      (error.response?.data as { message?: string } | undefined)?.message ??
      error.message ??
      "Request failed";
    return Promise.reject(new Error(message));
  }
);
