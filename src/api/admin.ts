import { api } from './axios';

// Helper to unwrap response
const unwrap = <T,>(p: any): T => (p && typeof p === 'object' && 'data' in p ? (p.data as T) : (p as T));

export interface AdminStats {
    total_tenants: number;
    active_tenants: number;
    total_users: number;
    recent_tenants: any[];
}

export const getAdminStats = async () => {
    const res = await api.get('/admin/stats');
    return unwrap<AdminStats>(res.data);
};

export const listTenants = async (page = 1) => {
    const res = await api.get(`/admin/tenants?page=${page}`);
    return unwrap<any>(res.data);
};

export const getTenantDetails = async (id: string) => {
    const res = await api.get(`/admin/tenants/${id}`);
    return unwrap<any>(res.data);
};

export const updateTenant = async (id: string, data: { is_active?: boolean; plan?: string }) => {
    const res = await api.put(`/admin/tenants/${id}`, data);
    return unwrap<any>(res.data);
};

export const impersonateTenant = async (id: string) => {
    const res = await api.post(`/admin/tenants/${id}/impersonate`);
    return unwrap<any>(res.data);
};
