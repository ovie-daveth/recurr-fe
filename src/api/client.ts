import axios from "axios";
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

api.interceptors.request.use((config) => {
  const token = authStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message ??
      error.response?.data?.message ??
      error.message ??
      "Request failed";
    return Promise.reject(new Error(message));
  }
);
