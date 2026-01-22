// src/api/axios.ts
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API_BASE_URL is missing. Add it in your Railway FRONTEND environment variables."
  );
}

// Remove trailing slash if present
const BASE_URL = API_BASE_URL.replace(/\/$/, "");

export const api = axios.create({
  baseURL: BASE_URL,
  // keep cookies off; we're using bearer tokens
  withCredentials: false,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Attach auth + tenant headers on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  const tenant = JSON.parse(localStorage.getItem("tenant") || "null");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // <— important
  if (tenant?.slug) {
    config.headers["X-Tenant-Slug"] = tenant.slug;
  }

  return config;
});

// Global 401/419 handler → redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 419) {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("tenant_id");
      localStorage.removeItem("tenant"); // ✅ added (avoids stale tenant slug issues)
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

// Idempotency helper for POST/PUT where needed
export const withIdem = (headers?: Record<string, string>) => ({
  headers: {
    "Idempotency-Key": crypto.randomUUID(),
    ...(headers || {}),
  },
});
