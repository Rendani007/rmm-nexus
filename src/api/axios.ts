// src/api/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1").replace(
    /\/$/,
    ""
  );

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // bearer tokens only
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Attach auth + tenant headers on every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem("auth_token");

  const tenantRaw = localStorage.getItem("tenant");
  const tenant = tenantRaw ? JSON.parse(tenantRaw) : null;

  config.headers = config.headers ?? {};

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenant?.slug) config.headers["X-Tenant-Slug"] = tenant.slug; // important

  return config;
});

// Global 401/419 handler → redirect to login
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    const status = error?.response?.status;

    if (status === 401 || status === 419) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("tenant"); // ✅ correct key
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Idempotency helper for POST/PUT where needed
export const withIdem = (headers?: Record<string, string>) => ({
  headers: {
    ...(headers || {}),
    "Idempotency-Key": crypto.randomUUID(),
  },
});
