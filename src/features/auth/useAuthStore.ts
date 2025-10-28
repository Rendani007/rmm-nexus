import { create } from 'zustand';
import type { User, Tenant } from '@/types';

interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  setAuth: (user: User, tenant: Tenant, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  tenant: null,
  token: localStorage.getItem('auth_token'),
  setAuth: (user, tenant, token) => {
    localStorage.setItem('auth_token', token);
    set({ user, tenant, token });
  },
  clearAuth: () => {
    localStorage.removeItem('auth_token');
    set({ user: null, tenant: null, token: null });
  },
}));
