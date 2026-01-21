// src/api/auth.ts
import { api } from './axios';
import type { AuthLoginBody, AuthLoginResp } from '@/types';

// Small helper to unwrap either `{ data: ... }` or a plain payload
const unwrap = <T,>(p: any): T => (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (p as T));

export const login = async (body: AuthLoginBody): Promise<AuthLoginResp> => {
  const res = await api.post('/auth/login', body);
  const d = unwrap<any>(res.data);
  // Normalize to the shape your UI expects
  return {
    message: d?.message,
    user: d?.user,
    tenant: d?.tenant,
    token: d?.token,
    expires_at: d?.expires_at,
  } as AuthLoginResp;
};

export const profile = async () => {
  const res = await api.get('/auth/profile');
  return unwrap(res.data);
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  return unwrap(res.data);
};

export const changePassword = async (body: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => {
  const res = await api.post('/auth/change-password', body);
  return unwrap(res.data);
};

export const registerUser = async (body: any) => {
  const res = await api.post('/auth/register', body);
  return unwrap(res.data);
};

export const registerBusiness = async (body: any): Promise<AuthLoginResp> => {
  const res = await api.post('/auth/register-business', body);
  const d = unwrap<any>(res.data);
  return {
    message: d?.message,
    user: d?.user,
    tenant: d?.tenant,
    token: d?.token,
    expires_at: d?.expires_at,
  } as AuthLoginResp;
};

