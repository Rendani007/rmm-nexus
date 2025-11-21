// src/api/axios.ts
import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  // keep cookies off; we're using bearer tokens
  withCredentials: false,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Attach auth + tenant headers on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenant?.slug) config.headers['X-Tenant-Slug'] = tenant.slug;  // <— important

  return config;
});

// Global 401/419 handler → redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 || status === 419) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_id');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Idempotency helper for POST/PUT where needed
export const withIdem = (headers?: Record<string, string>) => ({
  headers: { 'Idempotency-Key': crypto.randomUUID(), ...(headers || {}) },
});
