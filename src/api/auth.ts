import { api } from './axios';
import type { AuthLoginBody, AuthLoginResp } from '@/types';

export const login = (body: AuthLoginBody) =>
  api.post<AuthLoginResp>('/auth/login', body).then((r) => r.data);

export const profile = () => api.get('/auth/profile').then((r) => r.data);

export const logout = () => api.post('/auth/logout').then((r) => r.data);

export const changePassword = (body: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => api.post('/auth/change-password', body).then((r) => r.data);

export const registerUser = (body: any) =>
  api.post('/auth/register', body).then((r) => r.data);
